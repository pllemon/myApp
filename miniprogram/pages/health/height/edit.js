const db = require('../../../utils/db.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    height: '',
    notes: ''
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑身高' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增身高' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_HEIGHT, id);
      if (r) {
        this.setData({
          date: r.date || this.formatToday(),
          height: r.height || '',
          notes: r.notes || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onHeightInput(e) {
    const v = e.detail.value.replace(/[^\d.]/g, '');
    this.setData({ height: v });
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const { date, height, notes, profileId, id, isEdit } = this.data;

    if (!height) {
      wx.showToast({ title: '请输入身高', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        height: parseFloat(height),
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_HEIGHT, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_HEIGHT, record);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});