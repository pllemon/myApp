const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const EXERCISE_TYPES = [
  { value: 'walk', label: '步行', met: 3.5 },
  { value: 'run', label: '跑步', met: 8.0 },
  { value: 'cycle', label: '骑行', met: 7.5 },
  { value: 'swim', label: '游泳', met: 8.0 },
  { value: 'yoga', label: '瑜伽', met: 2.5 },
  { value: 'gym', label: '健身', met: 6.0 },
  { value: 'ball', label: '球类', met: 7.0 },
  { value: 'dance', label: '舞蹈', met: 5.0 },
  { value: 'hike', label: '徒步', met: 6.0 },
  { value: 'other', label: '其他', met: 4.0 }
];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    typeIdx: 0,
    typeOptions: EXERCISE_TYPES,
    duration: '',
    distance: '',
    calories: '',
    caloriesEstimated: false,
    notes: '',
    profileWeight: 0
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId, date: this.formatToday(), time: this.formatNowTime() });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑运动' });
      this.loadRecord(options.id, options.profileId);
    } else {
      wx.setNavigationBarTitle({ title: '新增运动' });
      this.fetchProfileWeight(options.profileId);
    }
  },

  formatToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  formatNowTime() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },

  async fetchProfileWeight(profileId) {
    if (!profileId) return;
    const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, profileId);
    if (profile && Number(profile.weight) > 0) this.setData({ profileWeight: Number(profile.weight) });
  },

  async loadRecord(id, profileId) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_EXERCISE, id);
      if (r) {
        const idx = EXERCISE_TYPES.findIndex(x => x.value === r.type);
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          typeIdx: idx >= 0 ? idx : 0,
          duration: r.duration || '',
          distance: r.distance || '',
          calories: r.calories || '',
          caloriesEstimated: !!r.caloriesEstimated,
          notes: r.notes || r.note || ''
        });
      }
    } catch (err) { wx.showToast({ title: '加载失败', icon: 'none' }); }
    await this.fetchProfileWeight(profileId);
    wx.hideLoading();
  },

  // 修复：kcal = MET × 体重(kg) × 时长(小时)，缺体重时用 60kg 默认值并标记估算
  autoCalcCalories(typeIdx, duration) {
    if (!duration) return { value: '', estimated: false };
    const met = EXERCISE_TYPES[typeIdx].met;
    const r = healthUtil.calcExerciseCalories(met, parseFloat(duration), this.data.profileWeight);
    return r ? { value: String(r.value), estimated: r.estimated } : { value: '', estimated: false };
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onTypeChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({ typeIdx: idx });
    if (this.data.duration && !this.data.caloriesEdited) {
      const c = this.autoCalcCalories(idx, this.data.duration);
      this.setData({ calories: c.value, caloriesEstimated: c.estimated });
    }
  },
  onDurationInput(e) {
    const v = e.detail.value;
    this.setData({ duration: v });
    if (v && !this.data.caloriesEdited) {
      const c = this.autoCalcCalories(this.data.typeIdx, v);
      this.setData({ calories: c.value, caloriesEstimated: c.estimated });
    }
  },
  onDistanceInput(e) { this.setData({ distance: e.detail.value }); },
  onCaloriesInput(e) { this.setData({ calories: e.detail.value, caloriesEdited: !!e.detail.value }); },
  onNoteInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const d = this.data;
    if (!d.duration) { wx.showToast({ title: '请输入运动时长', icon: 'none' }); return; }
    const err = healthUtil.validateFields([
      { field: 'duration', value: d.duration, required: true },
      { field: 'distance', value: d.distance },
      { field: 'calories', value: d.calories }
    ]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId,
        date: d.date,
        time: d.time,
        type: EXERCISE_TYPES[d.typeIdx].value,
        duration: parseFloat(d.duration),
        distance: d.distance ? parseFloat(d.distance) : '',
        calories: d.calories ? parseFloat(d.calories) : '',
        caloriesEstimated: d.caloriesEstimated,
        notes: d.notes.trim(),
        note: d.notes.trim(),
        updatedAt: Date.now()
      };
      if (d.isEdit) await db.update(db.COLLECTIONS.HEALTH_EXERCISE, d.id, record);
      else await db.add(db.COLLECTIONS.HEALTH_EXERCISE, record);

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
