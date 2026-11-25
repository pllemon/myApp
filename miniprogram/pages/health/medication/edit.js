const db = require('../../../utils/db.js');

const FREQUENCY_OPTIONS = ['每天一次', '每天两次', '每天三次', '每8小时', '每12小时', '饭前', '饭后', '睡前', '每周一次', '按需'];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    name: '',
    dosage: '',
    frequency: '',
    frequencyOptions: FREQUENCY_OPTIONS,
    startDate: '',
    endDate: '',
    isOngoing: true,
    notes: '',
    reminderEnabled: false,
    reminderTimes: '',
    reminderInput: ''
  },

  onLoad(options) {
    this.setData({ 
      profileId: options.profileId,
      startDate: this.formatToday()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑用药' });
      this.loadMed(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增用药' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async loadMed(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const m = await db.getById(db.COLLECTIONS.HEALTH_MEDICATION, id);
      if (m) {
        this.setData({
          name: m.name || '',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          startDate: m.startDate || this.formatToday(),
          endDate: m.endDate || '',
          isOngoing: !m.endDate,
          notes: m.notes || '',
          reminderEnabled: !!m.reminderEnabled,
          reminderTimes: m.reminderTimes || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onDosageInput(e) { this.setData({ dosage: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onFrequencyChange(e) { this.setData({ frequency: e.detail.value }); },

  onStartDateChange(e) { this.setData({ startDate: e.detail.value }); },
  onEndDateChange(e) { this.setData({ endDate: e.detail.value }); },

  toggleOngoing(e) {
    this.setData({ 
      isOngoing: e.detail.value,
      endDate: e.detail.value ? '' : this.data.endDate
    });
  },

  toggleReminder(e) {
    const enabled = e.detail.value;
    this.setData({ reminderEnabled: enabled });
    if (enabled && !this.data.reminderTimes) {
      const presets = { '每天一次': '08:00', '每天两次': '08:00, 20:00', '每天三次': '08:00, 12:00, 20:00' };
      this.setData({ reminderTimes: presets[this.data.frequency] || '08:00' });
    }
  },

  onReminderInput(e) { this.setData({ reminderTimes: e.detail.value }); },

  async save() {
    const { name, dosage, frequency, startDate, endDate, isOngoing, notes, profileId, id, isEdit, reminderEnabled, reminderTimes } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        startDate,
        endDate: isOngoing ? '' : endDate,
        notes: notes.trim(),
        reminderEnabled,
        reminderTimes: reminderEnabled ? reminderTimes.trim() : ''
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_MEDICATION, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_MEDICATION, record);
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