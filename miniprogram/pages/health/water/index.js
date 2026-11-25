const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const QUICK_AMOUNTS = [100, 200, 300, 500];

function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

Page({
  data: {
    profileId: '',
    profile: null,
    goal: 2000,
    quickAmounts: QUICK_AMOUNTS,
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

  onGoalEdit() {
    wx.showModal({
      title: '每日饮水目标',
      content: '当前 ' + this.data.goal + 'ml',
      editable: true,
      placeholderText: '输入目标毫升数',
      success: async (res) => {
        if (!res.confirm) return;
        const n = parseInt(res.content, 10);
        if (!n || n <= 0) {
          wx.showToast({ title: '请输入有效数字', icon: 'none' });
          return;
        }
        if (!this.data.profileId) {
          wx.showToast({ title: '档案未加载', icon: 'none' });
          return;
        }
        await db.update(db.COLLECTIONS.HEALTH_PROFILE, this.data.profileId, { waterGoal: n });
        this.setData({ goal: n });
        wx.showToast({ title: '目标已更新', icon: 'success' });
      }
    });
  },

  async onAddQuick(e) {
    const val = Number(e.currentTarget.dataset.val);
    if (!val || !this.data.profileId) {
      wx.showToast({ title: '档案未加载', icon: 'none' });
      return;
    }
    const now = new Date();
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    try {
      await db.add(db.COLLECTIONS.HEALTH_WATER, {
        profileId: this.data.profileId,
        date: todayKey,
        time: nowTime(),
        amount: val,
        note: '快捷添加'
      });
      wx.showToast({ title: '+' + val + 'ml 已记录', icon: 'success' });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: '记录失败', icon: 'none' });
    }
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