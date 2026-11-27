const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    weight: '',
    bodyFat: '',
    notes: '',
    profileHeight: 0,
    bmiPreview: null,
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId, date: this.formatToday(), time: this.formatNowTime() });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑体重' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增体重' });
      this.fetchProfileHeight();
    }
  },

  formatToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  formatNowTime() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },

  async fetchProfileHeight() {
    if (!this.data.profileId) return;
    const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
    if (profile && profile.height) this.setData({ profileHeight: profile.height });
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_WEIGHT, id);
      if (r) {
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          weight: r.weight || '',
          bodyFat: r.bodyFat || '',
          notes: r.notes || ''
        });
        // BMI 落库值优先，老记录回退到按档案身高现算
        if (r.bmi != null) {
          this.setData({ bmiPreview: { value: r.bmi, status: r.bmiStatus || '' } });
        } else {
          const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
          if (profile && profile.height) {
            this.setData({ profileHeight: profile.height, bmiPreview: healthUtil.calcBMI(profile.height, parseFloat(r.weight)) });
          }
        }
      }
    } catch (err) { wx.showToast({ title: '加载失败', icon: 'none' }); }
    wx.hideLoading();
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onWeightInput(e) {
    const w = e.detail.value;
    this.setData({ weight: w });
    if (this.data.profileHeight && w) this.setData({ bmiPreview: healthUtil.calcBMI(this.data.profileHeight, parseFloat(w)) });
    else this.setData({ bmiPreview: null });
  },
  onFatInput(e) { this.setData({ bodyFat: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const d = this.data;
    if (!d.weight) { wx.showToast({ title: '请输入体重', icon: 'none' }); return; }
    const err = healthUtil.validateFields([
      { field: 'weight', value: d.weight, required: true },
      { field: 'bodyFat', value: d.bodyFat }
    ]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    // BMI 按本次体重 + 档案身高计算并落库，保证历史记录可复现
    let bmi = null, bmiStatus = '';
    if (d.profileHeight > 0) {
      const r = healthUtil.calcBMI(d.profileHeight, parseFloat(d.weight));
      if (r) { bmi = r.value; bmiStatus = r.status; }
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId,
        date: d.date,
        time: d.time,
        weight: parseFloat(d.weight),
        bodyFat: d.bodyFat ? parseFloat(d.bodyFat) : '',
        bmi,
        bmiStatus,
        heightUsed: d.profileHeight || '',
        notes: d.notes.trim(),
        updatedAt: Date.now()
      };
      if (d.isEdit) await db.update(db.COLLECTIONS.HEALTH_WEIGHT, d.id, record);
      else await db.add(db.COLLECTIONS.HEALTH_WEIGHT, record);

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
