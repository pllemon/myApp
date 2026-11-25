const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const categoryUtil = require('../../../utils/category.js');
const bookUtil = require('../../../utils/book.js');

Page({
  data: {
    books: [],
    activeBookId: '',
    currentBook: null,
    currentMonth: '',
    monthLabel: '',
    monthExpense: '0.00',
    monthIncome: '0.00',
    days: [],
    records: [],
    groupedByDay: [],
    showTypeFilter: false,
    typeFilter: 'all',
    categoryMap: {},
    hasPrev: false,
    hasNext: false
  },

  onLoad() {
    this.initMonth();
  },

  onShow() {
    this.loadBooks();
  },

  async loadBooks() {
    try {
      const books = await bookUtil.getAllBooks();
      const curId = bookUtil.getCurrentBookId();
      if (!books.find(b => b._id === curId)) {
        bookUtil.switchBook(books[0]._id);
      }
      const activeId = bookUtil.getCurrentBookId();
      const currentBook = books.find(b => b._id === activeId) || books[0];
      this.setData({
        books,
        activeBookId: activeId,
        currentBook
      });
      this.initCategoryMap();
      this.loadRecords();
    } catch (e) {
      console.error('loadBooks error:', e);
    }
  },

  initCategoryMap() {
    const map = categoryUtil.buildCategoryMap(this.data.activeBookId);
    this.setData({ categoryMap: map });
  },

  initMonth() {
    const m = dateUtil.currentMonth();
    this.setData({
      currentMonth: `${m.year}-${m.month}`,
      monthLabel: m.label
    });
  },

  changeMonth(delta) {
    const [y, m] = this.data.currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newYear = d.getFullYear();
    const newMonth = d.getMonth() + 1;
    const label = `${newYear}年${newMonth}月`;
    this.setData({
      currentMonth: `${newYear}-${newMonth}`,
      monthLabel: label,
      hasPrev: true,
      hasNext: dateUtil.currentMonth().year === newYear && dateUtil.currentMonth().month === newMonth ? false : true
    });
    this.loadRecords();
  },

  prevMonth() { this.changeMonth(-1); },
  nextMonth() {
    const cur = dateUtil.currentMonth();
    const [y, m] = this.data.currentMonth.split('-').map(Number);
    if (y === cur.year && m === cur.month) return;
    this.changeMonth(1);
  },

  async loadRecords() {
    if (!this.data.activeBookId) return;
    const [y, m] = this.data.currentMonth.split('-').map(Number);
    const range = dateUtil.monthRange(y, m);
    const filter = { createdAt: range, bookId: this.data.activeBookId };
    if (this.data.typeFilter !== 'all') {
      filter.type = this.data.typeFilter;
    }
    const records = await db.query(db.COLLECTIONS.ACCOUNTING, filter, { key: 'createdAt', order: 'desc' });

    let expense = 0, income = 0;
    records.forEach(r => {
      if (r.type === 'expense') expense += r.amount || 0;
      if (r.type === 'income') income += r.amount || 0;
    });

    const grouped = this.groupByDay(records);
    const cur = dateUtil.currentMonth();

    this.setData({
      records,
      groupedByDay: grouped,
      monthExpense: expense.toFixed(2),
      monthIncome: income.toFixed(2),
      hasPrev: true,
      hasNext: !(cur.year === y && cur.month === m)
    });
  },

  groupByDay(records) {
    const groups = {};
    records.forEach(r => {
      const date = dateUtil.formatDate(r.createdAt, 'YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = {
          date,
          label: this.formatDayLabel(date),
          dayExpense: 0,
          dayIncome: 0,
          items: []
        };
      }
      groups[date].items.push(r);
      if (r.type === 'expense') groups[date].dayExpense += r.amount || 0;
      if (r.type === 'income') groups[date].dayIncome += r.amount || 0;
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  },

  formatDayLabel(dateStr) {
    const today = dateUtil.today();
    const yesterday = dateUtil.formatDate(Date.now() - 86400000, 'YYYY-MM-DD');
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    const d = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  },

  getCategoryInfo(record) {
    if (record.categoryId) {
      const info = this.data.categoryMap[record.categoryId];
      if (info) return { icon: info.icon || '📌', name: info.name, parentIcon: info.parentIcon, parentName: info.parentName };
    }
    if (record.parentCategory && record.category) {
      return { icon: record.categoryIcon || '📌', name: record.category, parentIcon: record.parentCategoryIcon || '📁', parentName: record.parentCategory };
    }
    return { icon: '📌', name: record.category || '未分类', parentIcon: '📁', parentName: '其他' };
  },

  getRecordDisplay(record) {
    const info = this.getCategoryInfo(record);
    return {
      ...record,
      displayIcon: info.icon,
      displayName: info.name,
      displayParentIcon: info.parentIcon,
      displayParentName: info.parentName
    };
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/accounting/edit/index?bookId=' + this.data.activeBookId });
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/accounting/edit/index?id=${id}` });
  },

  goToCategoryManager() {
    wx.navigateTo({ url: '/pages/accounting/category/index' });
  },

  goToStats() {
    wx.navigateTo({ url: '/pages/accounting/stats/index' });
  },

  goToAll() {
    wx.navigateTo({ url: '/pages/accounting/all/index' });
  },

  goToBooks() {
    wx.navigateTo({ url: '/pages/accounting/books/index' });
  },

  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmColor: '#E74C3C'
    });
    if (res.confirm) {
      await db.remove(db.COLLECTIONS.ACCOUNTING, id);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadRecords();
    }
  },

  toggleFilter() {
    this.setData({ showTypeFilter: !this.data.showTypeFilter });
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ typeFilter: type, showTypeFilter: false });
    this.loadRecords();
  },

  async switchBook(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeBookId) {
      this.goToBooks();
      return;
    }
    bookUtil.switchBook(id);
    const currentBook = this.data.books.find(b => b._id === id);
    this.setData({
      activeBookId: id,
      currentBook
    });
    this.initCategoryMap();
    this.loadRecords();
  }
});