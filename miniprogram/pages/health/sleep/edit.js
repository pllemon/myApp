const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const QUALITY_OPTIONS = [
  { value: 5, label: '极好' },
  { value: 4, label: '不错' },
  { value: 3, label: '一般' },
  { value: 2, label: '较差' },
  { value: 1, label: '极差' }
];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    sleepTime: '',
    wakeTime: '',
    duration: '',
    qualityIdx: 2,
    qualityOptions: QUALITY_OPTIONS,
    deepSleep: '',
    notes: ''
  },

  onLoad(options) {
    const now = new Date();
    const yest = new Date(now.getTime() - 86400000);
    this.setData({
      profileId: options.profileId,
      date: yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0'),
      sleepTime: '23:00',
      wakeTime: '07:00',
      duration: 8
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑睡眠' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增睡眠' });
    }
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_SLEEP, id);
      if (r) {
        const idx = QUALITY_OPTIONS.findIndex(x => x.value === (r.quality || 3));
        this.setData({
          date: r.date || this.data.date,
          sleepTime: r.sleepTime || this.data.sleepTime,
          wakeTime: r.wakeTime || this.data.wakeTime,
          duration: r.duration || '',
          qualityIdx: idx >= 0 ? idx : 2,
          deepSleep: r.deepSleep || '',
          notes: r.notes || r.note || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  calcDuration(s, w) {
    if (!s || !w) return '';
    const [sh, sm] = s.split(':').map(Number);
    const [wh, wm] = w.split(':').map(Number);
    let mins = (wh * 60 + wm) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return (mins / 60).toFixed(1);
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onSleepChange(e) {
    const v = e.detail.value;
    this.setData({ sleepTime: v });
    const d = this.calcDuration(v, this.data.wakeTime);
    if (d) this.setData({ duration: d });
  },
  onWakeChange(e) {
    const v = e.detail.value;
    this.setData({ wakeTime: v });
    const d = this.calcDuration(this.data.sleepTime, v);
    if (d) this.setData({ duration: d });
  },
  onQualityChange(e) { this.setData({ qualityIdx: e.detail.index }); },
  onDeepInput(e) { this.setData({ deepSleep: e.detail.value }); },
  onNoteInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const { date, sleepTime, wakeTime, qualityIdx, deepSleep, notes, profileId, id, isEdit, duration } = this.data;

    if (!sleepTime || !wakeTime) {
      wx.showToast({ title: '请输入入睡和起床时间', icon: 'none' });
      return;
    }
    if (deepSleep && (Number(deepSleep) < 0 || Number(deepSleep) > 24)) {
      wx.showToast({ title: '深睡时长应在 0-24 小时', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        sleepTime,
        wakeTime,
        duration: duration || this.calcDuration(sleepTime, wakeTime),
        quality: QUALITY_OPTIONS[qualityIdx].value,
        deepSleep: deepSleep ? parseFloat(deepSleep) : '',
        notes: notes.trim(),
        note: notes.trim(),
        updatedAt: Date.now()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_SLEEP, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_SLEEP, record);
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