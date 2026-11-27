const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const TYPES = healthUtil.GLUCOSE_TYPES;
const MEAL_TYPES = healthUtil.MEAL_TYPE_OPTIONS;
const SPECIMENS = healthUtil.SPECIMEN_OPTIONS;

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
    typeOptions: TYPES,
    mealType: '',
    mealTypeLabel: '',
    mealTypeOptions: MEAL_TYPES,
    specimenSource: '',
    specimenLabel: '',
    specimenOptions: SPECIMENS,
    notes: '',
    preview: null,
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
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
        // 修复：原来用 .value 当展示文案，回显成英文 fasting；改用 .label
        const typeItem = healthUtil.normalizeEnum(r.type, TYPES) || TYPES[0];
        const meal = healthUtil.normalizeEnum(r.mealType, MEAL_TYPES);
        const specimen = healthUtil.normalizeEnum(r.specimenSource, SPECIMENS);
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNow(),
          value: r.value || '',
          type: typeItem.value,
          typeLabel: typeItem.label,
          mealType: meal ? meal.value : '',
          mealTypeLabel: meal ? meal.label : '',
          specimenSource: specimen ? specimen.value : '',
          specimenLabel: specimen ? specimen.label : '',
          notes: r.notes || ''
        });
        this.updatePreview(r.value, typeItem.value);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(v, type) {
    if (v) {
      this.setData({ preview: healthUtil.judgeGlucose(parseFloat(v), type) });
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
    const option = e.detail.option || {};
    this.setData({ type: option.value, typeLabel: option.label });
    this.updatePreview(this.data.value, option.value);
  },
  onMealTypeChange(e) { this.setData({ mealType: e.detail.value, mealTypeLabel: e.detail.option.label }); },
  onSpecimenChange(e) { this.setData({ specimenSource: e.detail.value, specimenLabel: e.detail.option.label }); },

  async save() {
    const d = this.data;
    if (!d.value) {
      wx.showToast({ title: '请输入血糖值', icon: 'none' });
      return;
    }
    const err = healthUtil.validateFields([{ field: 'glucose', value: d.value, required: true }]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId,
        date: d.date,
        time: d.time,
        value: parseFloat(d.value),
        unit: 'mmol/L',
        type: d.type,
        mealType: d.mealType,
        specimenSource: d.specimenSource,
        notes: d.notes.trim(),
        judgeVersion: healthUtil.JUDGE_VERSION,
        updatedAt: Date.now()
      };

      if (d.isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_GLUCOSE, d.id, record);
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
