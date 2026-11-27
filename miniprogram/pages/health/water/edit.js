const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const QUICK_AMOUNTS = [100, 200, 250, 300, 500];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    amount: '',
    notes: '',
    quickAmounts: QUICK_AMOUNTS
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday(),
      time: this.formatNowTime()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑饮水' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增饮水' });
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
      const r = await db.getById(db.COLLECTIONS.HEALTH_WATER, id);
      if (r) {
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          amount: r.amount || '',
          notes: r.notes || r.note || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onAmountInput(e) { this.setData({ amount: e.detail.value }); },
  onNoteInput(e) { this.setData({ notes: e.detail.value }); },
  onQuickTap(e) {
    const v = e.currentTarget.dataset.val;
    this.setData({ amount: String(v) });
  },

  async save() {
    const { date, time, amount, notes, profileId, id, isEdit } = this.data;

    if (!amount) {
      wx.showToast({ title: '请输入饮水量', icon: 'none' });
      return;
    }
    const err = healthUtil.validateFields([{ field: 'amount', value: amount, required: true }]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        amount: parseFloat(amount),
        notes: notes.trim(),
        note: notes.trim(),
        updatedAt: Date.now()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_WATER, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_WATER, record);
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