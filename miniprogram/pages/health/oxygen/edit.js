const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    oxygen: '',
    pulse: '',
    notes: '',
    preview: null
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday(),
      time: this.formatNowTime()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑血氧' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增血氧' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  formatNowTime() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_OXYGEN, id);
      if (r) {
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          oxygen: r.oxygen || '',
          pulse: r.pulse || '',
          notes: r.notes || ''
        });
        this.updatePreview(r.oxygen, r.pulse);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(o, p) {
    if (!o) { this.setData({ preview: null }); return; }
    const st = healthUtil.judgeOxygen(parseFloat(o), p ? parseFloat(p) : null);
    this.setData({ preview: st });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onOxygenInput(e) {
    const v = e.detail.value;
    this.setData({ oxygen: v });
    this.updatePreview(v, this.data.pulse);
  },
  onPulseInput(e) {
    const v = e.detail.value;
    this.setData({ pulse: v });
    this.updatePreview(this.data.oxygen, v);
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const { date, time, oxygen, pulse, notes, profileId, id, isEdit } = this.data;

    if (!oxygen) {
      wx.showToast({ title: '请输入血氧值', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        oxygen: parseFloat(oxygen),
        pulse: pulse ? parseFloat(pulse) : '',
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_OXYGEN, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_OXYGEN, record);
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