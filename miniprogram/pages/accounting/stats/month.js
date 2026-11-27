const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const bookUtil = require('../../../utils/book.js');

Page({
  data: {
    year: 2026,
    month: 1,
    categoryId: '',
    title: '',
    summary: { expense: '0.00', income: '0.00', balance: '0.00' },
    groupedByDay: []
  },

  onLoad(options) {
    const year = parseInt(options.year, 10);
    const month = parseInt(options.month, 10);
    const categoryId = options.categoryId || '';
    this._bookId = bookUtil.getCurrentBookId();
    this.setData({
      year,
      month,
      categoryId,
      title: `${year}年${month}月明细` + (categoryId ? ' · 分类筛选' : '')
    });
    wx.setNavigationBarTitle({ title: `${year}年${month}月` });
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  async loadRecords() {
    const { year, month } = this.data;
    const monthKey = year + '-' + (month < 10 ? '0' + month : month);

    const all = await db.query(db.COLLECTIONS.ACCOUNTING, { bookId: this._bookId });
    const records = all.filter(r => {
      if (dateUtil.bizMonthOf(r) !== monthKey) return false;
      if (!this.data.categoryId) return true;
      return r.categoryId === this.data.categoryId || r.parentCategoryId === this.data.categoryId;
    });

    let expense = 0, income = 0;
    const dayMap = {};
    records.forEach(r => {
      if (r.type === 'expense') expense += r.amount || 0;
      if (r.type === 'income') income += r.amount || 0;

      const dateKey = dateUtil.bizDateOf(r);
      const d = new Date(dateKey + 'T00:00:00');
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          label: `${d.getMonth() + 1}月${d.getDate()}日`,
          weekday: this.getWeekday(d),
          dayExpense: 0,
          dayIncome: 0,
          items: []
        };
      }
      const day = dayMap[dateKey];
      day.items.push(r);
      if (r.type === 'expense') day.dayExpense += r.amount || 0;
      if (r.type === 'income') day.dayIncome += r.amount || 0;
    });

    const groupedByDay = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));

    this.setData({
      summary: {
        expense: expense.toFixed(2),
        income: income.toFixed(2),
        balance: (income - expense).toFixed(2)
      },
      groupedByDay
    });
  },

  getWeekday(d) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[d.getDay()];
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/accounting/edit/index?id=${id}` });
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({ current: src, urls });
  }
});