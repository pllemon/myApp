const calendar = require('../../../utils/calendar.js');
const dateUtil = require('../../../utils/date.js');
const theme = require('../../../utils/theme.js');
const todoUtil = require('../../../utils/todo.js');

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

  async toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    const day = this._dailyMap && this._dailyMap[this.data.selectedDate];
    const todo = day && day.todo && day.todo.find(t => t._id === id);
    if (!todo) return;
    try {
      await todoUtil.toggleComplete(todo);
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
    wx.navigateTo({ url: '/pages/todo/edit/index?id=' + id });
  },

  goAnniversary(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/anniversary/edit/index?id=' + id });
  },

  goWishlist(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/wishlist/edit/index?id=' + id });
  },

  goCheckin() {
    wx.navigateTo({ url: '/pages/checkin/index/index' });
  },

  goNewAccounting() {
    wx.reLaunch({ url: '/pages/accounting/index/index' });
  },

  goNewDiary() {
    wx.reLaunch({ url: '/pages/diary/index/index' });
  }
});