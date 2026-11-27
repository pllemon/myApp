const tabState = require('../../../utils/tab-state.js');
const ui = require('../../../utils/interaction.js');
const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const categoryUtil = require('../../../utils/category.js');
const bookUtil = require('../../../utils/book.js');
const statsCache = require('../../../utils/stats-cache.js');
const imageUtil = require('../../../utils/image.js');
const budgetUtil = require('../../../utils/budget.js');

Page({
  behaviors: [tabState.behavior],
  data: {
    books: [],
    activeBookId: '',
    currentBook: null,
    currentMonth: '',
    monthLabel: '',
    monthExpense: '0.00',
    monthIncome: '0.00',
    balanceText: '¥0.00',
    records: [],
    showTypeFilter: false,
    typeFilter: 'all',
    categoryMap: {},
    hasPrev: false,
    hasNext: false,
    budgetStatus: null,
    showSearch: false,
    searchKey: '',
    filteredGroups: [],
    budgetWarnings: []
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
    const monthKey = this.data.currentMonth;
    // 汇总与翻页判断取全账本记录；收支筛选只作用于列表渲染，不下推到查询
    const all = await db.query(db.COLLECTIONS.ACCOUNTING, { bookId: this.data.activeBookId });
    const records = all
      .filter(r => dateUtil.bizMonthOf(r) === monthKey)
      .sort((a, b) => {
        const da = dateUtil.bizDateOf(a), db2 = dateUtil.bizDateOf(b);
        if (da !== db2) return da > db2 ? -1 : 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

    let expense = 0, income = 0;
    records.forEach(r => {
      if (r.type === 'expense') expense += r.amount || 0;
      if (r.type === 'income') income += r.amount || 0;
    });
    const balance = income - expense;
    const hasPrev = all.some(r => {
      const rm = dateUtil.bizMonthOf(r);
      return !!rm && rm < monthKey;
    });
    const cur = dateUtil.currentMonth();

    this.setData({
      records,
      monthExpense: expense.toFixed(2),
      monthIncome: income.toFixed(2),
      balanceText: (balance < 0 ? '-¥' : '¥') + Math.abs(balance).toFixed(2),
      hasPrev,
      hasNext: !(cur.year === y && cur.month === m)
    });
    this.loadBudget();
    this.buildFilteredGroups();
  },

  async loadBudget() {
    if (!this.data.activeBookId) return;
    this.loadBudgetWarnings();
    const status = await budgetUtil.getStatus(this.data.activeBookId, this.data.currentMonth);
    const total = status.find(s => !s.categoryId);
    if (!total) {
      this.setData({ budgetStatus: null });
      return;
    }
    this.setData({
      budgetStatus: {
        limit: total.limit,
        percent: total.percent,
        fill: Math.min(total.percent, 100),
        warning: total.warning,
        exceeded: total.exceeded,
        remain: Number((total.limit - total.spent).toFixed(2)).toFixed(2),
        exceed: Number((total.spent - total.limit).toFixed(2)).toFixed(2)
      }
    });
  },

  goToBudget() {
    wx.navigateTo({
      url: `/pages/accounting/budget/index?month=${this.data.currentMonth}`
    });
  },

  groupByDay(records) {
    const groups = {};
    records.forEach(r => {
      const date = dateUtil.bizDateOf(r);
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

  // WXML 不支持直接调用页面方法，金额展示串在 buildFilteredGroups 中预生成
  toMoney(value, type) {
    const n = Number(value) || 0;
    const sign = type === 'expense' ? '-' : '+';
    return sign + '¥' + Math.abs(n).toFixed(2);
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

  async onRecordLongPress(e) {
    const action = await ui.showItemActions();
    if (action === 'edit') this.goToEdit(e);
    if (action === 'delete') await this.deleteRecord(e);
  },

  async deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    const res = await ui.confirmDeleteLegacy()
    if (res.confirm) {
      const record = await db.getById(db.COLLECTIONS.ACCOUNTING, id);
      if (record && record.images) imageUtil.cleanAllImages(record.images);
      await db.remove(db.COLLECTIONS.ACCOUNTING, id);
      statsCache.removeRecord(record);
      ui.toast('已删除');
      this.loadRecords();
    }
  },

  toggleFilter() {
    this.setData({ showTypeFilter: !this.data.showTypeFilter });
  },

  onToggleFilter() {
    this.toggleFilter();
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
  },

  buildFilteredGroups() {
    const key = String(this.data.searchKey || '').trim().toLowerCase();
    let records = this.data.records || [];
    if (this.data.typeFilter !== 'all') {
      records = records.filter(r => r.type === this.data.typeFilter);
    }
    if (key) {
      records = records.filter(r => {
        const mapInfo = r.categoryId ? this.data.categoryMap[r.categoryId] : null;
        const note = String(r.note || '').toLowerCase();
        const categoryName = String(r.category || (mapInfo && mapInfo.name) || '').toLowerCase();
        const amount = String(r.amount == null ? '' : r.amount);
        return note.indexOf(key) !== -1 || categoryName.indexOf(key) !== -1 || amount.indexOf(key) !== -1;
      });
    }
    const groups = this.groupByDay(records);
    groups.forEach(g => g.items.forEach(r => {
      r.displayAmount = this.toMoney(r.amount, r.type);
    }));
    this.setData({ filteredGroups: groups });
  },

  onOpenSearch() {
    this.setData({ showSearch: true });
  },

  onCloseSearch() {
    this.setData({ showSearch: false, searchKey: '' });
    this.buildFilteredGroups();
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value || '' });
    this.buildFilteredGroups();
  },

  onSearchClear() {
    this.setData({ searchKey: '' });
    this.buildFilteredGroups();
  },

  async loadBudgetWarnings() {
    if (!budgetUtil || !budgetUtil.getWarnings) {
      this.setData({ budgetWarnings: [] });
      return;
    }
    try {
      const res = await budgetUtil.getWarnings(this.data.activeBookId, this.data.currentMonth);
      const list = Array.isArray(res) ? res.map(w => ({
        ...w,
        short: w.exceeded ? `超支 ${w.percent}%` : `预算已用 ${w.percent}%`,
        text: w.exceeded
          ? `预算超支 ${w.percent}%（支出 ¥${w.spent} / 预算 ¥${w.limit}）`
          : `预算已使用 ${w.percent}%，注意控制支出`
      })) : [];
      this.setData({ budgetWarnings: list });
    } catch (e) {
      this.setData({ budgetWarnings: [] });
    }
  }
});