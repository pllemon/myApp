const tabState = require('../../../utils/tab-state.js');
const ui = require('../../../utils/interaction.js');
const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const checkinUtil = require('../../../utils/checkin.js');
const imageUtil = require('../../../utils/image.js');

Page({
  behaviors: [tabState.behavior],
  data: {
    today: '',
    greeting: '',
    habits: [],
    records: [],
    checkedIds: {},
    totalCount: 0,
    checkedCount: 0,
    showDone: false
  },

  onLoad() {
    this.initHeader();
  },

  onShow() {
    this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  initHeader() {
    const today = dateUtil.today();
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';
    if (hour < 6) greeting = '夜深了，坚持一下';
    else if (hour < 12) greeting = '早上好';
    else if (hour < 14) greeting = '中午好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    this.setData({
      today: `${today} ${weekday}`,
      greeting
    });
  },

  async loadAll() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const habits = await checkinUtil.loadHabits();
      const records = await checkinUtil.loadAllCheckinRecords();

      const checkedIds = {};
      const today = dateUtil.today();
      records.forEach(r => {
        if (r.date === today) checkedIds[r.habitId] = true;
      });

      const habitsWithStreaks = [];
      for (const h of habits) {
        const habitRecords = records.filter(r => r.habitId === h._id);
        const dates = [...new Set(habitRecords.map(r => r.date))].sort();
        const streaks = checkinUtil.calcStreaks(dates);
        const hasCheckedToday = !!checkedIds[h._id];
        habitsWithStreaks.push({
          ...h,
          _streaks: streaks,
          _checkedToday: hasCheckedToday,
          _totalDays: dates.length,
          _progress: h.targetDays ? Math.min(100, Math.round((dates.length / h.targetDays) * 100)) : null
        });
      }

      this.setData({
        habits: habitsWithStreaks,
        records,
        checkedIds,
        totalCount: habits.length,
        checkedCount: Object.keys(checkedIds).length,
        showDone: Object.keys(checkedIds).length > 0
      });
    } catch (err) {
      ui.toast('加载失败', 'none');
    }
    wx.hideLoading();
  },

  async toggleCheckin(e) {
    const { id, name } = e.currentTarget.dataset;
    const already = this.data.checkedIds[id];

    if (already) {
      await checkinUtil.uncheckin(id, dateUtil.today());
      wx.showToast({ title: '已取消', icon: 'none', duration: 800 });
    } else {
      await checkinUtil.checkin(id, name, dateUtil.today());
      const habit = this.data.habits.find(h => h._id === id);
      const newStreak = (habit && habit._streaks.current || 0) + 1;
      wx.showToast({
        title: newStreak >= 7 ? `连续 ${newStreak} 天！` : '打卡成功',
        icon: 'none',
        duration: 1200
      });
    }
    this.loadAll();
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/checkin/create/index' });
  },

  goEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/checkin/create/index?id=${id}` });
  },

  goCalendar(e) {
    const { id } = e.currentTarget.dataset;
    const url = id ? `/pages/checkin/calendar/index?habitId=${id}` : '/pages/checkin/calendar/index';
    wx.navigateTo({ url });
  },

  async onHabitLongPress(e) {
    const action = await ui.showItemActions();
    if (action === 'edit') this.goEdit(e);
    if (action === 'delete') await this.deleteHabit(e);
  },

  async deleteHabit(e) {
    const { id, name } = e.currentTarget.dataset;
    const res = await ui.confirmDeleteLegacy({ title: '删除习惯', content: `确定删除「${name}」吗？所有打卡记录也会一并删除。` })
    if (!res.confirm) return;

    await db.remove(db.COLLECTIONS.CHECKIN_HABIT, id);
    const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, { habitId: id });
    records.forEach(r => {
      if (r.images) imageUtil.cleanAllImages(r.images);
    });
    await Promise.all(records.map(r => db.remove(db.COLLECTIONS.CHECKIN_RECORD, r._id)));
    ui.toast('已删除');
    this.loadAll();
  }
});