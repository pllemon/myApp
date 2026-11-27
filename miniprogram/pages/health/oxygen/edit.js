const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const SCENES = healthUtil.OXYGEN_SCENE_OPTIONS;
const SOURCES = healthUtil.OXYGEN_SOURCE_OPTIONS;

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    oxygen: '',
    pulse: '',
    scene: 'resting',
    sceneLabel: '静息',
    sceneOptions: SCENES,
    source: 'manual',
    sourceLabel: '手动测量',
    sourceOptions: SOURCES,
    notes: '',
    preview: null,
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId, date: this.formatToday(), time: this.formatNowTime() });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑血氧' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增血氧' });
    }
  },

  formatToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  formatNowTime() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_OXYGEN, id);
      if (r) {
        const scene = healthUtil.normalizeEnum(r.scene, SCENES);
        const src = healthUtil.normalizeEnum(r.source, SOURCES);
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          oxygen: r.oxygen || '',
          pulse: r.pulse || '',
          scene: scene ? scene.value : 'resting',
          sceneLabel: scene ? scene.label : '静息',
          source: src ? src.value : 'manual',
          sourceLabel: src ? src.label : '手动测量',
          notes: r.notes || ''
        });
        this.updatePreview(r.oxygen, r.pulse);
      }
    } catch (err) { wx.showToast({ title: '加载失败', icon: 'none' }); }
    wx.hideLoading();
  },

  updatePreview(o, p) {
    if (!o) { this.setData({ preview: null }); return; }
    this.setData({ preview: healthUtil.judgeOxygen(parseFloat(o), p ? parseFloat(p) : null) });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onOxygenInput(e) { const v = e.detail.value; this.setData({ oxygen: v }); this.updatePreview(v, this.data.pulse); },
  onPulseInput(e) { const v = e.detail.value; this.setData({ pulse: v }); this.updatePreview(this.data.oxygen, v); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },
  onSceneChange(e) { this.setData({ scene: e.detail.value, sceneLabel: e.detail.option.label }); },
  onSourceChange(e) { this.setData({ source: e.detail.value, sourceLabel: e.detail.option.label }); },

  async save() {
    const d = this.data;
    if (!d.oxygen) { wx.showToast({ title: '请输入血氧值', icon: 'none' }); return; }
    const err = healthUtil.validateFields([
      { field: 'oxygen', value: d.oxygen, required: true },
      { field: 'pulse', value: d.pulse }
    ]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId, date: d.date, time: d.time,
        oxygen: parseFloat(d.oxygen),
        pulse: d.pulse ? parseFloat(d.pulse) : '',
        scene: d.scene, source: d.source,
        notes: d.notes.trim(),
        judgeVersion: healthUtil.JUDGE_VERSION, updatedAt: Date.now()
      };
      if (d.isEdit) await db.update(db.COLLECTIONS.HEALTH_OXYGEN, d.id, record);
      else await db.add(db.COLLECTIONS.HEALTH_OXYGEN, record);

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
