const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const LOCATION_OPTIONS = [
  { value: 'oral', label: '口腔' },
  { value: 'ear', label: '耳温' },
  { value: 'forehead', label: '额温' },
  { value: 'underarm', label: '腋下' },
  { value: 'rectal', label: '直肠' }
];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    temperature: '',
    locationIdx: 3,
    locationLabel: '腋下',
    locationOptions: LOCATION_OPTIONS,
    notes: '',
    preview: null,
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId, date: this.formatToday(), time: this.formatNowTime() });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑体温' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增体温' });
    }
  },

  formatToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  formatNowTime() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },

  currentLocation() { return LOCATION_OPTIONS[this.data.locationIdx] || LOCATION_OPTIONS[3]; },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_TEMPERATURE, id);
      if (r) {
        const idx = LOCATION_OPTIONS.findIndex(x => x.value === r.location);
        const finalIdx = idx >= 0 ? idx : 3;
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          temperature: r.temperature || '',
          locationIdx: finalIdx,
          locationLabel: LOCATION_OPTIONS[finalIdx].label,
          notes: r.notes || ''
        });
        if (r.temperature) this.setData({ preview: healthUtil.judgeTemperature(parseFloat(r.temperature), LOCATION_OPTIONS[finalIdx].value) });
      }
    } catch (err) { wx.showToast({ title: '加载失败', icon: 'none' }); }
    wx.hideLoading();
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onLocationChange(e) {
    const idx = e.detail.index != null ? e.detail.index : parseInt(e.detail.value);
    this.setData({ locationIdx: idx, locationLabel: LOCATION_OPTIONS[idx].label });
    if (this.data.temperature) this.setData({ preview: healthUtil.judgeTemperature(parseFloat(this.data.temperature), LOCATION_OPTIONS[idx].value) });
  },
  onTempInput(e) {
    const v = e.detail.value;
    this.setData({ temperature: v });
    if (v) this.setData({ preview: healthUtil.judgeTemperature(parseFloat(v), this.currentLocation().value) });
    else this.setData({ preview: null });
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const d = this.data;
    if (!d.temperature) { wx.showToast({ title: '请输入体温', icon: 'none' }); return; }
    const err = healthUtil.validateFields([{ field: 'temperature', value: d.temperature, required: true }]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId, date: d.date, time: d.time,
        temperature: parseFloat(d.temperature),
        location: this.currentLocation().value,
        notes: d.notes.trim(),
        judgeVersion: healthUtil.JUDGE_VERSION, updatedAt: Date.now()
      };
      if (d.isEdit) await db.update(db.COLLECTIONS.HEALTH_TEMPERATURE, d.id, record);
      else await db.add(db.COLLECTIONS.HEALTH_TEMPERATURE, record);

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
