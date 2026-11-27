const tabConfig = require('../../../utils/tabbar-config.js');
const theme = require('../../../utils/theme.js');

function buildModules(ids) {
  const selected = new Set(ids);
  return tabConfig.getCandidates().map(m => ({
    id: m.id,
    text: m.text,
    fixed: m.fixed,
    selected: selected.has(m.id)
  }));
}

function buildPreview(ids) {
  const all = tabConfig.getCandidates();
  return ids.map(id => {
    const m = all.find(x => x.id === id);
    return { id: id, text: m ? m.text : id, fixed: m ? m.fixed : false };
  });
}

function buildMoreItems(ids) {
  const selected = new Set(ids);
  return tabConfig.getCandidates()
    .filter(m => !m.fixed && !selected.has(m.id))
    .map(m => ({ id: m.id, text: m.text }));
}

Page({
  data: {
    themeStyle: '',
    modules: [],
    previewItems: [],
    selectedIds: [],
    moreItems: [],
    draggingId: ''
  },

  onLoad() {
    theme.applyToPage(this);
    this.loadData();
  },

  onShow() {
    theme.applyToPage(this);
  },

  loadData() {
    this.applyIds(tabConfig.getSelectedIds());
  },

  applyIds(ids) {
    this.setData({
      selectedIds: ids,
      modules: buildModules(ids),
      previewItems: buildPreview(ids),
      moreItems: buildMoreItems(ids)
    });
  },

  toggleModule(e) {
    const id = e.currentTarget.dataset.id;
    const m = tabConfig.getCandidates().find(x => x.id === id);
    if (!m) return;
    if (m.fixed) {
      wx.showToast({ title: '首页 / 我的固定在底栏', icon: 'none' });
      return;
    }

    const ids = this.data.selectedIds.slice();
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      const middleCount = ids.filter(x => x !== 'home' && x !== 'profile').length;
      if (middleCount <= tabConfig.MIDDLE_MIN) {
        wx.showToast({ title: '至少保留 1 个中间项', icon: 'none' });
        return;
      }
      ids.splice(idx, 1);
    } else {
      if (ids.length >= tabConfig.MAX_COUNT) {
        wx.showToast({ title: '最多 5 个，先取消一个', icon: 'none' });
        return;
      }
      ids.splice(ids.indexOf('profile'), 0, id);
    }
    this.applyIds(ids);
    tabConfig.setSelectedIds(ids);
  },

  // 方案 B：拖拽只发生在 5 格预览条内，不与下方点选冲突
  onPreviewTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    const m = tabConfig.getCandidates().find(x => x.id === id);
    if (!m || m.fixed) return;

    this._dragId = id;
    this.setData({ draggingId: id });
    try { wx.vibrateShort({ type: 'light' }); } catch (err) {}

    wx.createSelectorQuery()
      .selectAll('.preview-item')
      .boundingClientRect(rects => { this._rects = rects || []; })
      .exec();
  },

  onPreviewTouchMove(e) {
    if (!this._dragId || !this._rects || this._rects.length === 0) return;
    const x = e.touches[0].clientX;
    let target = -1;
    let best = Infinity;

    this._rects.forEach((r, i) => {
      if (x >= r.left && x <= r.right) target = i;
      const d = Math.abs(x - (r.left + r.right) / 2);
      if (d < best) { best = d; if (target < 0) target = i; }
    });
    if (target < 0) return;

    const ids = this.data.selectedIds.slice();
    const from = ids.indexOf(this._dragId);
    if (from === target || from < 1 || from >= ids.length - 1) return;
    if (target < 1 || target >= ids.length - 1) return;

    ids.splice(from, 1);
    ids.splice(target, 0, this._dragId);
    this.applyIds(ids);
  },

  onPreviewTouchEnd() {
    this._dragId = null;
    this._rects = null;
    tabConfig.setSelectedIds(this.data.selectedIds);
    this.setData({ draggingId: '' });
  },

  reset() {
    const ids = tabConfig.setSelectedIds(tabConfig.getPreset('default').defaultIds.slice());
    this.applyIds(ids);
    wx.showToast({ title: '已重置', icon: 'success' });
  },

  finish() {
    wx.navigateBack();
  }
});
