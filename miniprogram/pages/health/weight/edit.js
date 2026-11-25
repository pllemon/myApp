const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    weight: '',
    bodyFat: '',
    notes: '',
    bmiPreview: null
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑体重' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增体重' });
      this.fetchProfileHeight();
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async fetchProfileHeight() {
    if (!this.data.profileId) return;
    const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
    if (profile && profile.height) {
      this.setData({ profileHeight: profile.height });
    }
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_WEIGHT, id);
      if (r) {
        this.setData({
          date: r.date || this.formatToday(),
          weight: r.weight || '',
          bodyFat: r.bodyFat || '',
          notes: r.notes || ''
        });
        const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
        if (profile && profile.height) {
          const bmi = healthUtil.calcBMI(profile.height, parseFloat(r.weight));
          this.setData({ profileHeight: profile.height, bmiPreview: bmi });
        }
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onWeightInput(e) {
    const w = e.detail.value;
    this.setData({ weight: w });
    if (this.data.profileHeight && w) {
      const bmi = healthUtil.calcBMI(this.data.profileHeight, parseFloat(w));
      this.setData({ bmiPreview: bmi });
    } else {
      this.setData({ bmiPreview: null });
    }
  },
  onFatInput(e) { this.setData({ bodyFat: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const { date, weight, bodyFat, notes, profileId, id, isEdit } = this.data;

    if (!weight) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        weight: parseFloat(weight),
        bodyFat: bodyFat ? parseFloat(bodyFat) : '',
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_WEIGHT, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_WEIGHT, record);
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