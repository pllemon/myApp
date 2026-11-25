const tabConfig = require('../../../utils/tabbar-config.js');

Page({
  data: {
    items: [],
    shortcutItems: [],
    selectedIds: [],
    shortcutSelectedIds: [],
    maxCount: 5,
    minCount: 3,
    shortcutMax: 8,
    draggingIdx: -1,
    _draggingIdx: -1,
    _startY: 0,
    _startOffset: 0,
    _accDy: 0,
    _itemH: 0,
    _totalH: 0
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    const all = tabConfig.getCandidates();
    const savedIds = tabConfig.getSelectedIds();
    const validIds = savedIds.filter(id => all.find(c => c.id === id));
    if (validIds.length === 0) {
      validIds.push(...tabConfig.getPreset('default').defaultIds);
    }

    const fixedFirst = all.find(c => c.id === 'home');
    const fixedLast = all.find(c => c.id === 'profile');
    const middle = all.filter(c => !c.fixed);

    const selectedSet = new Set(validIds);

    const middleItems = validIds
      .filter(id => id !== 'home' && id !== 'profile')
      .map(id => {
        const c = middle.find(m => m.id === id);
        return { ...c, selected: true, fixed: false, _internalId: id };
      });
    const unselectedMiddle = middle
      .filter(m => !selectedSet.has(m.id))
      .map(m => ({ ...m, selected: false, fixed: false, _internalId: m.id }));

    const items = [
      { ...fixedFirst, selected: true, fixed: 'first', _internalId: 'home' },
      ...middleItems,
      ...unselectedMiddle,
      { ...fixedLast, selected: true, fixed: 'last', _internalId: 'profile' }
    ];

    this.setData({ items, selectedIds: validIds });

    const shortcutAll = tabConfig.getShortcutConfig();
    const savedShortcut = tabConfig.loadShortcutIds();
    const shortcutItems = shortcutAll.map(c => ({
      ...c,
      selected: savedShortcut.includes(c.id)
    }));
    this.setData({
      shortcutItems,
      shortcutSelectedIds: savedShortcut.filter(id => shortcutAll.find(c => c.id === id))
    });
  },

  toggleSelect(e) {
    const idx = e.currentTarget.dataset.idx;
    const item = this.data.items[idx];
    if (item.fixed) return;

    let selectedIds = this.data.selectedIds.slice();
    const isSelected = selectedIds.includes(item._internalId);

    if (isSelected) {
      const middleCount = selectedIds.filter(id => id !== 'home' && id !== 'profile').length;
      if (middleCount <= tabConfig.MIDDLE_MIN) {
        wx.showToast({ title: '至少保留1个中间项', icon: 'none' });
        return;
      }
      selectedIds = selectedIds.filter(id => id !== item._internalId);
    } else {
      if (selectedIds.length >= this.data.maxCount) {
        wx.showToast({ title: '最多选5个', icon: 'none' });
        return;
      }
      const lastIdx = selectedIds.indexOf('profile');
      selectedIds.splice(lastIdx, 0, item._internalId);
    }

    const items = this.data.items.map((it, i) => {
      if (i === idx) return { ...it, selected: !isSelected };
      return it;
    });

    this.setData({ items, selectedIds });
  },

  toggleShortcut(e) {
    const idx = e.currentTarget.dataset.idx;
    const item = this.data.shortcutItems[idx];
    const tabSelected = this.data.selectedIds;
    const allCandidates = tabConfig.getCandidates();
    const tabUnselected = allCandidates.filter(c => !tabSelected.includes(c.id));

    if (!item.selected) {
      const totalWillBe = (this.data.shortcutSelectedIds.length) + tabUnselected.length;
      if (totalWillBe >= this.data.shortcutMax) {
        wx.showToast({ title: '快捷入口已达上限', icon: 'none' });
        return;
      }
    }

    const items = this.data.shortcutItems.map((it, i) => {
      if (i === idx) return { ...it, selected: !it.selected };
      return it;
    });
    const shortcutSelectedIds = items.filter(i => i.selected).map(i => i.id);
    this.setData({ shortcutItems: items, shortcutSelectedIds });
  },

  onLongPress(e) {
    const idx = e.currentTarget.dataset.idx;
    const item = this.data.items[idx];
    if (item.fixed) return;
    this._draggingIdx = idx;
    this.setData({ draggingIdx: idx });
    wx.vibrateShort({ type: 'light' });

    const query = wx.createSelectorQuery();
    query.select('.tabbar-item').boundingClientRect(rects => {
      if (rects && rects[idx]) {
        this._itemH = rects[idx].height;
        this._totalH = rects.reduce((s, r) => s + r.height, 0);
      }
    }).exec();

    const touch = e.touches[0];
    this._startY = touch.pageY;
    this._accDy = 0;
  },

  onTouchMove(e) {
    if (this._draggingIdx < 0) return;
    const touch = e.touches[0];
    const dy = touch.pageY - this._startY;

    if (Math.abs(dy) > this._itemH / 2 && this._itemH > 0) {
      const direction = dy > 0 ? 1 : -1;
      this._startY = touch.pageY;
      this.swap(this._draggingIdx, this._draggingIdx + direction);
    }
  },

  swap(fromIdx, toIdx) {
    if (toIdx < 1 || toIdx >= this.data.items.length - 1) return;
    if (fromIdx < 1 || fromIdx >= this.data.items.length - 1) return;

    const items = this.data.items.slice();
    const tmp = items[fromIdx];
    items[fromIdx] = items[toIdx];
    items[toIdx] = tmp;

    const newSelectedIds = [];
    const sortedIds = items.map(i => i._internalId);
    const hasHome = sortedIds.includes('home');
    const hasProfile = sortedIds.includes('profile');
    if (hasHome) newSelectedIds.push('home');
    sortedIds.forEach(id => {
      if (id !== 'home' && id !== 'profile' && this.data.selectedIds.includes(id)) {
        newSelectedIds.push(id);
      }
    });
    if (hasProfile) newSelectedIds.push('profile');

    this._draggingIdx = toIdx;
    this.setData({ items, selectedIds: newSelectedIds, draggingIdx: toIdx });
  },

  onTouchEnd() {
    this._draggingIdx = -1;
    this.setData({ draggingIdx: -1 });
  },

  reset() {
    const preset = tabConfig.getPreset('default');
    tabConfig.setSelectedIds(preset.defaultIds.slice());
    const defaultShortcut = tabConfig.getShortcutConfig().map(c => c.id);
    tabConfig.saveShortcutIds(defaultShortcut);
    wx.showToast({ title: '已重置', icon: 'success' });
    this.loadData();
  },

  save() {
    tabConfig.setSelectedIds(this.data.selectedIds);
    tabConfig.saveShortcutIds(this.data.shortcutSelectedIds);

    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  }
});