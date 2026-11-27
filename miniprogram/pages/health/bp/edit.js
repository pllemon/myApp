const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const SOURCE_OPTIONS = healthUtil.BP_SOURCE_OPTIONS;
const POSITION_OPTIONS = healthUtil.BODY_POSITION_OPTIONS;
const ARM_OPTIONS = healthUtil.ARM_OPTIONS;

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    systolic: '',
    diastolic: '',
    pulse: '',
    source: 'manual',
    sourceLabel: '手动测量',
    sourceOptions: SOURCE_OPTIONS,
    position: 'sitting',
    positionLabel: '坐位',
    positionOptions: POSITION_OPTIONS,
    arm: 'left',
    armLabel: '左臂',
    armOptions: ARM_OPTIONS,
    isRepeat: false,
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
      wx.setNavigationBarTitle({ title: '编辑血压' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增血压' });
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
      const r = await db.getById(db.COLLECTIONS.HEALTH_BP, id);
      if (r) {
        // 老数据 source 为中文字符串，用 normalizeEnum 兼容成 value
        const src = healthUtil.normalizeEnum(r.source, SOURCE_OPTIONS);
        const pos = healthUtil.normalizeEnum(r.bodyPosition, POSITION_OPTIONS);
        const arm = healthUtil.normalizeEnum(r.arm, ARM_OPTIONS);
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNow(),
          systolic: r.systolic || '',
          diastolic: r.diastolic || '',
          pulse: r.pulse || '',
          source: src ? src.value : 'manual',
          sourceLabel: src ? src.label : '手动测量',
          position: pos ? pos.value : 'sitting',
          positionLabel: pos ? pos.label : '坐位',
          arm: arm ? arm.value : 'left',
          armLabel: arm ? arm.label : '左臂',
          isRepeat: !!r.isRepeat,
          notes: r.notes || ''
        });
        this.updatePreview(r.systolic, r.diastolic);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(sys, dia) {
    if (sys && dia) {
      this.setData({ preview: healthUtil.judgeBP(parseFloat(sys), parseFloat(dia)) });
    } else {
      this.setData({ preview: null });
    }
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onSysInput(e) {
    const sys = e.detail.value;
    this.setData({ systolic: sys });
    this.updatePreview(sys, this.data.diastolic);
  },
  onDiaInput(e) {
    const dia = e.detail.value;
    this.setData({ diastolic: dia });
    this.updatePreview(this.data.systolic, dia);
  },
  onPulseInput(e) { this.setData({ pulse: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onSourceChange(e) { this.setData({ source: e.detail.value, sourceLabel: e.detail.option.label }); },
  onPositionChange(e) { this.setData({ position: e.detail.value, positionLabel: e.detail.option.label }); },
  onArmChange(e) { this.setData({ arm: e.detail.value, armLabel: e.detail.option.label }); },
  onRepeatChange() { this.setData({ isRepeat: !this.data.isRepeat }); },

  async save() {
    const d = this.data;
    if (!d.systolic || !d.diastolic) {
      wx.showToast({ title: '请输入收缩压和舒张压', icon: 'none' });
      return;
    }
    const err = healthUtil.validateFields([
      { field: 'systolic', value: d.systolic, required: true },
      { field: 'diastolic', value: d.diastolic, required: true },
      { field: 'pulse', value: d.pulse }
    ]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId,
        date: d.date,
        time: d.time,
        systolic: parseFloat(d.systolic),
        diastolic: parseFloat(d.diastolic),
        pulse: d.pulse ? parseFloat(d.pulse) : '',
        source: d.source,
        bodyPosition: d.position,
        arm: d.arm,
        isRepeat: d.isRepeat,
        notes: d.notes.trim(),
        judgeVersion: healthUtil.JUDGE_VERSION,
        updatedAt: Date.now()
      };

      if (d.isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_BP, d.id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_BP, record);
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
