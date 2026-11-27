const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

// 与血糖 type 同口径：空腹/餐后2h/随机/睡前。老数据的 meal 字段读取时兼容。
const TYPE_OPTIONS = healthUtil.GLUCOSE_TYPES;

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    uricAcid: '',
    typeIdx: 0,
    typeLabel: '空腹',
    typeOptions: TYPE_OPTIONS,
    notes: '',
    gender: '',
    preview: null,
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId, date: this.formatToday() });
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
        const rawType = r.type || r.meal || 'fasting';
        const idx = TYPE_OPTIONS.findIndex(x => x.value === rawType);
        const finalIdx = idx >= 0 ? idx : 0;
        this.setData({
          date: r.date || this.formatToday(),
          uricAcid: r.uricAcid || '',
          typeIdx: finalIdx,
          typeLabel: TYPE_OPTIONS[finalIdx].label,
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
  onTypeChange(e) {
    const idx = e.detail.index != null ? e.detail.index : parseInt(e.detail.value);
    this.setData({ typeIdx: idx, typeLabel: TYPE_OPTIONS[idx].label });
  },
  onUricInput(e) {
    const v = e.detail.value;
    this.setData({ uricAcid: v });
    this.updatePreview(v);
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const d = this.data;
    if (!d.uricAcid) { wx.showToast({ title: '请输入尿酸值', icon: 'none' }); return; }
    const err = healthUtil.validateFields([{ field: 'uricAcid', value: d.uricAcid, required: true }]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId,
        date: d.date,
        uricAcid: parseFloat(d.uricAcid),
        type: TYPE_OPTIONS[d.typeIdx].value,
        meal: TYPE_OPTIONS[d.typeIdx].value, // 兼容老展示逻辑，后续可移除
        notes: d.notes.trim(),
        judgeVersion: healthUtil.JUDGE_VERSION,
        updatedAt: Date.now()
      };
      if (d.isEdit) await db.update(db.COLLECTIONS.HEALTH_URIC_ACID, d.id, record);
      else await db.add(db.COLLECTIONS.HEALTH_URIC_ACID, record);

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
