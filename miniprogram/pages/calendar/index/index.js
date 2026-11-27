const calendar = require('../../../utils/calendar.js');
const dateUtil = require('../../../utils/date.js');
const theme = require('../../../utils/theme.js');
const todoUtil = require('../../../utils/todo.js');
const checkinUtil = require('../../../utils/checkin.js');

Page({
  data: {
    monthYear: '',
    monthLabel: '',
    weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
    cells: [],
    selectedDate: '',
    today: '',
    detail: null
  },

  onLoad() {
    theme.applyToPage(this);
    const now = new Date();
    const today = dateUtil.today();
    this.setData({
      today,
      selectedDate: today,
      monthYear: now.getFullYear() + '-' + (now.getMonth() + 1),
      monthLabel: now.getFullYear() + '年' + (now.getMonth() + 1) + '月'
    });
    this.loadMonth();
  },

  onShow() {
    theme.applyToPage(this);
    this.loadMonth();
  },

  async loadMonth() {
    try {
      const [year, month] = this.data.monthYear.split('-').map(Number);
      const { dailyMap, habits } = await calendar.loadMonthData(year, month);
      this._dailyMap = dailyMap;
      this._habits = habits;
      const cells = calendar.buildMonthCellsWithMarks(year, month, dailyMap, this.data.selectedDate, this.data.today);
      const detail = calendar.getDayDetail(dailyMap, habits, this.data.selectedDate);
      this.setData({ cells, detail });
    } catch (e) {
      console.error('calendar loadMonth error:', e);
    }
  },

  refreshDetail() {
    if (!this._dailyMap) return;
    const detail = calendar.getDayDetail(this._dailyMap, this._habits, this.data.selectedDate);
    const [year, month] = this.data.monthYear.split('-').map(Number);
    const cells = calendar.buildMonthCellsWithMarks(year, month, this._dailyMap, this.data.selectedDate, this.data.today);
    this.setData({ cells, detail });
  },

  prevMonth() {
    const [y, m] = this.data.monthYear.split('-').map(Number);
    let ny = y, nm = m - 1;
    if (nm < 1) { nm = 12; ny--; }
    const first = ny + '-' + (nm < 10 ? '0' + nm : '' + nm) + '-01';
    this.setData({
      monthYear: ny + '-' + nm,
      monthLabel: ny + '年' + nm + '月',
      selectedDate: first
    });
    this.loadMonth();
  },

  nextMonth() {
    const [y, m] = this.data.monthYear.split('-').map(Number);
    let ny = y, nm = m + 1;
    if (nm > 12) { nm = 1; ny++; }
    const first = ny + '-' + (nm < 10 ? '0' + nm : '' + nm) + '-01';
    this.setData({
      monthYear: ny + '-' + nm,
      monthLabel: ny + '年' + nm + '月',
      selectedDate: first
    });
    this.loadMonth();
  },

  goToday() {
    const now = new Date();
    const today = dateUtil.today();
    this.setData({
      today,
      selectedDate: today,
      monthYear: now.getFullYear() + '-' + (now.getMonth() + 1),
      monthLabel: now.getFullYear() + '年' + (now.getMonth() + 1) + '月'
    });
    this.loadMonth();
  },

  selectDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date || date === this.data.selectedDate) return;
    this.setData({ selectedDate: date });
    this.refreshDetail();
  },

  async toggleCheckinDay(e) {
    const { id, checked } = e.currentTarget.dataset;
    const date = this.data.selectedDate;
    if (!id || !date) return;
    if (date > this.data.today) {
      wx.showToast({ title: '不能给未来日期打卡', icon: 'none' });
      return;
    }
    try {
      if (checked) {
        await checkinUtil.uncheckin(id, date);
        wx.showToast({ title: '已取消打卡', icon: 'none' });
      } else {
        const habit = (this._habits || []).find(h => h._id === id);
        await checkinUtil.checkin(id, habit ? habit.name : '', date);
        wx.showToast({ title: '打卡成功', icon: 'success' });
      }
      await this.loadMonth();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    const day = this._dailyMap && this._dailyMap[this.data.selectedDate];
    const todo = day && day.todo && day.todo.find(t => t._id === id);
    if (!todo) return;
    try {
      const patch = await todoUtil.toggleComplete(todo);
      if (patch && patch.cycleCount && patch.dueDate) {
        wx.showToast({ title: '下次：' + patch.dueDate.slice(5), icon: 'none' });
      }
      this.loadMonth();
    } catch (err) {
      console.error('toggle todo error:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  goAccounting(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/accounting/edit/index?id=' + id });
  },

  goDiary(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/diary/detail/index?id=' + id });
  },

  goTodo(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/todo/detail/index?id=' + id });
  },

  goAnniversary(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/anniversary/detail/index?id=' + id });
  },

  goWishlist(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/wishlist/detail/index?id=' + id });
  },

  goCheckin() {
    wx.navigateTo({ url: '/pages/checkin/index/index' });
  },

  goNewAccounting() {
    wx.navigateTo({ url: '/pages/accounting/edit/index' });
  },

  goNewDiary() {
    wx.navigateTo({ url: '/pages/diary/editor/index' });
  }
});