const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    rate: '',
    scene: 'resting',
    sceneLabel: '静息',
    sceneOptions: healthUtil.HEART_RATE_SCENES,
    notes: '',
    preview: null,
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
  },

  sceneLabelOf(scene) {
    const found = this.data.sceneOptions.find(o => o.value === scene);
    return found ? found.label : '静息';
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday(),
      time: this.formatNowTime()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑心率' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增心率' });
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
      const r = await db.getById(db.COLLECTIONS.HEALTH_HEART_RATE, id);
      if (r) {
        const scene = r.scene || 'resting';
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          rate: r.rate || '',
          scene,
          sceneLabel: this.sceneLabelOf(scene),
          notes: r.notes || ''
        });
        this.updatePreview(r.rate, scene);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(rate, scene) {
    if (!rate) { this.setData({ preview: null }); return; }
    const st = healthUtil.judgeHeartRate(parseFloat(rate), scene);
    this.setData({ preview: st });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onRateInput(e) {
    const v = e.detail.value;
    this.setData({ rate: v });
    this.updatePreview(v, this.data.scene);
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onSceneChange(e) {
    const { option } = e.detail;
    this.setData({ scene: option.value, sceneLabel: option.label });
    this.updatePreview(this.data.rate, option.value);
  },

  async save() {
    const { date, time, rate, scene, notes, profileId, id, isEdit } = this.data;

    if (!rate) {
      wx.showToast({ title: '请输入心率', icon: 'none' });
      return;
    }
    const err = healthUtil.validateFields([{ field: 'heartRate', value: rate, required: true }]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        rate: parseFloat(rate),
        scene,
        notes: notes.trim(),
        judgeVersion: healthUtil.JUDGE_VERSION,
        updatedAt: Date.now()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_HEART_RATE, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_HEART_RATE, record);
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