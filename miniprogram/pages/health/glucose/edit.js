const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    value: '',
    type: 'fasting',
    typeLabel: '空腹',
    typeOptions: healthUtil.GLUCOSE_TYPES,
    notes: '',
    preview: null
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday(),
      time: this.formatNow()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑血糖' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增血糖' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  formatNow() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_GLUCOSE, id);
      if (r) {
        const typeLabel = (healthUtil.GLUCOSE_TYPES.find(t => t.value === r.type) || {}).value || 'fasting';
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNow(),
          value: r.value || '',
          type: typeLabel,
          notes: r.notes || ''
        });
        this.updatePreview(r.value, typeLabel);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(v, type) {
    if (v) {
      const p = healthUtil.judgeGlucose(parseFloat(v), type);
      this.setData({ preview: p });
    } else {
      this.setData({ preview: null });
    }
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onValueInput(e) {
    const v = e.detail.value;
    this.setData({ value: v });
    this.updatePreview(v, this.data.type);
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onTypeChange(e) {
    const { option } = e.detail;
    this.setData({ type: option.value, typeLabel: option.label });
    this.updatePreview(this.data.value, option.value);
  },

  async save() {
    const { date, time, value, type, notes, profileId, id, isEdit } = this.data;

    if (!value) {
      wx.showToast({ title: '请输入血糖值', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        value: parseFloat(value),
        type,
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_GLUCOSE, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_GLUCOSE, record);
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