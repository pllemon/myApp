const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const bookUtil = require('../../../utils/book.js');

Page({
  data: {
    filter: 'all',
    groups: [],
    page: 1,
    pageSize: 50,
    hasMore: true,
    loading: false,
    totalLoaded: 0,
    totalAll: 0
  },

  onShow() {
    this._bookId = bookUtil.getCurrentBookId();
    this.reset();
    this.loadFirstPage();
  },

  onPullDownRefresh() {
    this.reset();
    this.loadFirstPage().then(() => wx.stopPullDownRefresh());
  },

  reset() {
    this.setData({
      groups: [],
      page: 1,
      hasMore: true,
      loading: false,
      totalLoaded: 0,
      totalAll: 0
    });
  },

  buildFilter() {
    const f = { bookId: this._bookId };
    if (this.data.filter !== 'all') f.type = this.data.filter;
    return f;
  },

  async loadFirstPage() {
    this.setData({ loading: true });
    try {
      const res = await db.page(db.COLLECTIONS.ACCOUNTING, {
        filter: this.buildFilter(),
        sortBy: { key: 'createdAt', order: 'desc' },
        page: 1,
        pageSize: this.data.pageSize
      });
      const groups = this.groupByDay(res.list);
      this.setData({
        groups,
        page: 1,
        hasMore: res.hasMore,
        totalLoaded: res.list.length,
        totalAll: res.total,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });
    try {
      const nextPage = this.data.page + 1;
      const res = await db.page(db.COLLECTIONS.ACCOUNTING, {
        filter: this.buildFilter(),
        sortBy: { key: 'createdAt', order: 'desc' },
        page: nextPage,
        pageSize: this.data.pageSize
      });
      const newGroups = this.groupByDay(res.list);
      const merged = this.mergeGroups(this.data.groups, newGroups);
      this.setData({
        groups: merged,
        page: nextPage,
        hasMore: res.hasMore,
        totalLoaded: this.data.totalLoaded + res.list.length,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  mergeGroups(existing, incoming) {
    const map = {};
    existing.forEach(g => map[g.date] = { ...g });
    incoming.forEach(g => {
      if (map[g.date]) {
        map[g.date].items = map[g.date].items.concat(g.items);
        map[g.date].dayExpense += g.dayExpense;
        map[g.date].dayIncome += g.dayIncome;
      } else {
        map[g.date] = g;
      }
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  },

  groupByDay(records) {
    const groups = {};
    records.forEach(r => {
      const date = dateUtil.formatDate(r.createdAt, 'YYYY-MM-DD');
      if (!groups[date]) {
        const d = new Date(r.createdAt);
        groups[date] = {
          date,
          label: `${d.getMonth() + 1}月${d.getDate()}日`,
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

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (filter === this.data.filter) return;
    this.setData({ filter });
    this.reset();
    this.loadFirstPage();
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/accounting/edit/index?id=${id}` });
  },

  onReachBottom() {
    this.loadMore();
  }
});