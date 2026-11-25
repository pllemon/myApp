const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const SOURCE_OPTIONS = ['手动测量', '电子血压计', '手环/手表', '医院测量'];

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
    source: '手动测量',
    sourceOptions: SOURCE_OPTIONS,
    notes: '',
    preview: null
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
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNow(),
          systolic: r.systolic || '',
          diastolic: r.diastolic || '',
          pulse: r.pulse || '',
          source: r.source || '手动测量',
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
      const p = healthUtil.judgeBP(parseFloat(sys), parseFloat(dia));
      this.setData({ preview: p });
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

  onSourceChange(e) { this.setData({ source: e.detail.value }); },

  async save() {
    const { date, time, systolic, diastolic, pulse, source, notes, profileId, id, isEdit } = this.data;

    if (!systolic || !diastolic) {
      wx.showToast({ title: '请输入收缩压和舒张压', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        systolic: parseFloat(systolic),
        diastolic: parseFloat(diastolic),
        pulse: pulse ? parseFloat(pulse) : '',
        source,
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_BP, id, record);
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