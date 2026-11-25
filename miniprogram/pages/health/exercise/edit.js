const db = require('../../../utils/db.js');

const EXERCISE_TYPES = [
  { value: 'walk', label: '🚶 步行', met: 3.5 },
  { value: 'run', label: '🏃 跑步', met: 8.0 },
  { value: 'cycle', label: '🚴 骑行', met: 7.5 },
  { value: 'swim', label: '🏊 游泳', met: 8.0 },
  { value: 'yoga', label: '🧘 瑜伽', met: 2.5 },
  { value: 'gym', label: '🏋️ 健身', met: 6.0 },
  { value: 'ball', label: '⚽ 球类', met: 7.0 },
  { value: 'dance', label: '💃 舞蹈', met: 5.0 },
  { value: 'hike', label: '🥾 徒步', met: 6.0 },
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
    note: ''
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday(),
      time: this.formatNowTime()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑运动' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增运动' });
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
          note: r.note || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  autoCalcCalories(typeIdx, duration) {
    if (!duration) return '';
    const profile = null;
    const met = EXERCISE_TYPES[typeIdx].met;
    return Math.round(met * parseFloat(duration));
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onTypeChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({ typeIdx: idx });
    if (this.data.duration) {
      this.setData({ calories: this.autoCalcCalories(idx, this.data.duration) });
    }
  },
  onDurationInput(e) {
    const v = e.detail.value;
    this.setData({ duration: v });
    if (v && !this.data.calories) {
      this.setData({ calories: this.autoCalcCalories(this.data.typeIdx, v) });
    }
  },
  onDistanceInput(e) { this.setData({ distance: e.detail.value }); },
  onCaloriesInput(e) { this.setData({ calories: e.detail.value }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  async save() {
    const { date, time, typeIdx, duration, distance, calories, note, profileId, id, isEdit } = this.data;

    if (!duration) {
      wx.showToast({ title: '请输入运动时长', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        type: EXERCISE_TYPES[typeIdx].value,
        duration: parseFloat(duration),
        distance: distance ? parseFloat(distance) : '',
        calories: calories ? parseFloat(calories) : '',
        note: note.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_EXERCISE, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_EXERCISE, record);
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