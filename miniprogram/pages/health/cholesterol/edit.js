const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const ITEM_OPTIONS = [
  { value: 'total', label: '总胆固醇' },
  { value: 'ldl', label: '低密度脂蛋白' },
  { value: 'hdl', label: '高密度脂蛋白' },
  { value: 'tg', label: '甘油三酯' }
];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    total: '',
    ldl: '',
    hdl: '',
    tg: '',
    notes: '',
    preview: null
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑血脂' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增血脂' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_CHOLESTEROL, id);
      if (r) {
        this.setData({
          date: r.date || this.formatToday(),
          total: r.total || '',
          ldl: r.ldl || '',
          hdl: r.hdl || '',
          tg: r.tg || '',
          notes: r.notes || ''
        });
        this.updatePreview(r.total, r.ldl, r.hdl, r.tg);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  updatePreview(t, l, h, tg) {
    if (!t && !l && !h && !tg) { this.setData({ preview: null }); return; }
    this.setData({
      preview: healthUtil.judgeCholesterol(
        t ? parseFloat(t) : null,
        l ? parseFloat(l) : null,
        h ? parseFloat(h) : null,
        tg ? parseFloat(tg) : null
      )
    });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTotalInput(e) {
    const v = e.detail.value;
    this.setData({ total: v });
    this.updatePreview(v, this.data.ldl, this.data.hdl, this.data.tg);
  },
  onLdlInput(e) {
    const v = e.detail.value;
    this.setData({ ldl: v });
    this.updatePreview(this.data.total, v, this.data.hdl, this.data.tg);
  },
  onHdlInput(e) {
    const v = e.detail.value;
    this.setData({ hdl: v });
    this.updatePreview(this.data.total, this.data.ldl, v, this.data.tg);
  },
  onTgInput(e) {
    const v = e.detail.value;
    this.setData({ tg: v });
    this.updatePreview(this.data.total, this.data.ldl, this.data.hdl, v);
  },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  async save() {
    const { date, total, ldl, hdl, tg, notes, profileId, id, isEdit } = this.data;

    if (!total && !ldl && !hdl && !tg) {
      wx.showToast({ title: '请至少填写一项指标', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        total: total ? parseFloat(total) : '',
        ldl: ldl ? parseFloat(ldl) : '',
        hdl: hdl ? parseFloat(hdl) : '',
        tg: tg ? parseFloat(tg) : '',
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_CHOLESTEROL, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_CHOLESTEROL, record);
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