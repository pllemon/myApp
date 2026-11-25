const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    profile: null,
    goal: 2000,
    todayTotal: 0,
    todayRecords: [],
    monthGroups: [],
    totalPages: 1
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId || '' });
  },

  async onShow() {
    if (!this.data.profileId) return;
    await this.loadData();
  },

  async loadData() {
    const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId);
    const all = await db.getAll(db.COLLECTIONS.HEALTH_WATER, { profileId: this.data.profileId });

    const now = new Date();
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const todayRecords = all.filter(r => r.date === todayKey).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const todayTotal = todayRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

    const groups = {};
    all.forEach(r => {
      const key = (r.date || '').substring(0, 7);
      if (!groups[key]) groups[key] = { month: key, total: 0, items: [] };
      groups[key].total += r.amount || 0;
      groups[key].items.push(r);
    });
    const monthGroups = Object.values(groups).sort((a, b) => (a.month < b.month ? 1 : -1));

    this.setData({
      profile,
      goal: (profile && profile.waterGoal) || 2000,
      todayRecords,
      todayTotal,
      monthGroups
    });
  },

  onAddQuick(e) {
    const val = e.currentTarget.dataset.val;
    wx.navigateTo({
      url: `/pages/health/water/edit?profileId=${this.data.profileId}`
    });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/health/water/edit?profileId=${this.data.profileId}&id=${id}`
    });
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async (res) => {
        if (res.confirm) {
          await db.remove(db.COLLECTIONS.HEALTH_WATER, id);
          wx.showToast({ title: '已删除', icon: 'success' });
          await this.loadData();
        }
      }
    });
  },

  goNew() {
    wx.navigateTo({
      url: `/pages/health/water/edit?profileId=${this.data.profileId}`
    });
  }
});