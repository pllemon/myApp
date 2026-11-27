const db = require('../../../utils/db.js');
const checkinUtil = require('../../../utils/checkin.js');

Page({
  data: {
    id: '',
    isEdit: false,
    name: '',
    icon: 'target',
    color: '#4A90D9',
    targetDays: 30,
    presetIndex: -1,
    iconOptions: [],
    colorOptions: [],
    showPresets: false,
    showIcons: false,
    showColors: false
  },

  onLoad(options) {
    this.setData({
      iconOptions: checkinUtil.ICON_OPTIONS,
      colorOptions: checkinUtil.COLOR_OPTIONS,
      presetList: checkinUtil.HABIT_PRESETS
    });

    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.loadHabit(options.id);
    }
  },

  async loadHabit(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const habit = await db.getById(db.COLLECTIONS.CHECKIN_HABIT, id);
      if (habit) {
        const presetIdx = checkinUtil.HABIT_PRESETS.findIndex(p => p.icon === habit.icon);
        wx.setNavigationBarTitle({ title: '编辑习惯' });
        this.setData({
          name: habit.name || '',
          icon: habit.icon || '',
          color: habit.color || '#4A90D9',
          targetDays: habit.targetDays || 30,
          presetIndex: presetIdx
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value, presetIndex: -1 });
  },

  onTargetInput(e) {
    const v = parseInt(e.detail.value) || 0;
    this.setData({ targetDays: v });
  },

  selectPreset(e) {
    const idx = e.currentTarget.dataset.index;
    const p = checkinUtil.HABIT_PRESETS[idx];
    this.setData({
      presetIndex: idx,
      name: p.name,
      icon: p.icon,
      color: p.color,
      showPresets: false
    });
  },

  togglePresets() {
    this.setData({
      showPresets: !this.data.showPresets,
      showIcons: false,
      showColors: false
    });
  },

  toggleIcons() {
    this.setData({
      showIcons: !this.data.showIcons,
      showPresets: false,
      showColors: false
    });
  },

  toggleColors() {
    this.setData({
      showColors: !this.data.showColors,
      showPresets: false,
      showIcons: false
    });
  },

  selectIcon(e) {
    const icon = e.detail ? e.detail.icon : e.currentTarget.dataset.icon;
    this.setData({ icon, presetIndex: -1 });
    this.toggleIcons();
  },

  selectColor(e) {
    this.setData({ color: e.detail.color });
    this.toggleColors();
  },

  async save() {
    const { name, icon, color, targetDays, id, isEdit } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请输入习惯名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      if (isEdit) {
        await db.update(db.COLLECTIONS.CHECKIN_HABIT, id, {
          name: name.trim(),
          icon,
          color,
          targetDays: targetDays || 30
        });
      } else {
        const allHabits = await db.list(db.COLLECTIONS.CHECKIN_HABIT);
        await db.add(db.COLLECTIONS.CHECKIN_HABIT, {
          name: name.trim(),
          icon,
          color,
          targetDays: targetDays || 30,
          sortOrder: allHabits.length
        });
      }
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async onDelete() {
    const { id, name } = this.data;
    if (!id) return;
    const res = await new Promise(resolve => {
      wx.showModal({
        title: '删除习惯',
        content: `确定删除「${name || '该习惯'}」吗？所有打卡记录也会一并删除。`,
        success: resolve,
        fail: () => resolve({ confirm: false })
      });
    });
    if (!res.confirm) return;

    wx.showLoading({ title: '删除中', mask: true });
    try {
      await db.remove(db.COLLECTIONS.CHECKIN_HABIT, id);
      const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, { habitId: id });
      const imageUtil = require('../../../utils/image.js');
      records.forEach(r => {
        if (r.images) imageUtil.cleanAllImages(r.images);
      });
      await Promise.all(records.map(r => db.remove(db.COLLECTIONS.CHECKIN_RECORD, r._id)));
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});