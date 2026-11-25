const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const MEAL_OPTIONS = [
  { value: 'fasting', label: '空腹' },
  { value: 'postprandial', label: '餐后2h' },
  { value: 'random', label: '随机' }
];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    uricAcid: '',
    mealIdx: 0,
    mealOptions: MEAL_OPTIONS,
    notes: '',
    gender: '',
    preview: null
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑尿酸' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增尿酸' });
      this.fetchProfileGender();
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async fetchProfileGender() {
    if (!this.data.profileId) return;
    const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
    if (profile && profile.gender) this.setData({ gender: profile.gender });
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_URIC_ACID, id);
      if (r) {
        const idx = MEAL_OPTIONS.findIndex(x => x.value === r.meal);
        this.setData({
          date: r.date || this.formatToday(),
          uricAcid: r.uricAcid || '',
          mealIdx: idx >= 0 ? idx : 0,
          notes: r.notes || ''
        });
        const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
        if (profile) this.setData({ gender: profile.gender || '' });
        if (r.uricAcid) this.updatePreview(r.uricAcid, profile ? profile.gender : '');
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(v, g) {
    if (!v) { this.setData({ preview: null }); return; }
    this.setData({ preview: healthUtil.judgeUricAcid(parseFloat(v), g || this.data.gender) });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onMealIdxChange(e) { this.setData({ mealIdx: e.detail.index }); },
  onUricInput(e) {
    const v = e.detail.value;
    this.setData({ uricAcid: v });
    this.updatePreview(v);
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const { date, uricAcid, mealIdx, notes, profileId, id, isEdit } = this.data;

    if (!uricAcid) {
      wx.showToast({ title: '请输入尿酸值', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        uricAcid: parseFloat(uricAcid),
        meal: MEAL_OPTIONS[mealIdx].value,
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_URIC_ACID, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_URIC_ACID, record);
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