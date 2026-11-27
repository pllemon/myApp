const budgetUtil = require('../../../utils/budget.js');
const ui = require('../../../utils/interaction.js');
const categoryUtil = require('../../../utils/category.js');
const bookUtil = require('../../../utils/book.js');
const dateUtil = require('../../../utils/date.js');

Page({
  data: {
    month: '',
    monthLabel: '',
    bookName: '',
    totalLimit: '',
    totalSpent: '0.00',
    totalPercent: 0,
    totalFill: 0,
    totalWarning: false,
    totalExceeded: false,
    totalExceedAmount: '0.00',
    categories: [],
    hasAny: false
  },

  onLoad(options) {
    const m = dateUtil.currentMonth();
    const month = options.month || `${m.year}-${m.month}`;
    this.setData({ month, monthLabel: this.makeLabel(month) });
    wx.setNavigationBarTitle({ title: '月度预算' });
  },

  onShow() {
    this.loadData();
  },

  makeLabel(month) {
    const [y, m] = month.split('-').map(Number);
    return `${y}年${m}月`;
  },

  async loadData() {
    const bookId = bookUtil.getCurrentBookId();
    if (!bookId) return;
    const book = await bookUtil.getCurrentBook();
    const parents = categoryUtil.getCategoriesByType('expense', bookId);
    const [status, spend] = await Promise.all([
      budgetUtil.getStatus(bookId, this.data.month),
      budgetUtil.getMonthSpend(bookId, this.data.month)
    ]);
    const map = {};
    status.forEach(s => { map[s.categoryId] = s; });
    const total = map[''];
    const totalLimit = total && total.limit ? String(total.limit) : '';
    const categories = parents.map(p => {
      const s = map[p._id];
      const spent = Number((spend.byCategory[p._id] || 0).toFixed(2));
      return {
        _id: p._id,
        name: p.name,
        icon: p.icon || 'pin',
        spent,
        limit: s && s.limit ? String(s.limit) : ''
      };
    });
    this.setData({
      bookName: book ? book.name : '',
      totalLimit,
      totalSpent: Number(spend.total.toFixed(2)).toFixed(2),
      totalPercent: total ? total.percent : 0,
      totalFill: total ? Math.min(total.percent, 100) : 0,
      totalWarning: total ? total.warning : false,
      totalExceeded: total ? total.exceeded : false,
      totalExceedAmount: total && total.exceeded
        ? Number((spend.total - total.limit).toFixed(2)).toFixed(2)
        : '0.00',
      categories,
      hasAny: status.length > 0
    });
  },

  onTotalInput(e) {
    this.setData({ totalLimit: e.detail.value });
  },

  onCatInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ ['categories[' + index + '].limit']: e.detail.value });
  },

  shiftMonth(delta) {
    const [y, m] = this.data.month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.setData({ month, monthLabel: this.makeLabel(month) }, () => this.loadData());
  },

  prevMonth() { this.shiftMonth(-1); },
  nextMonth() { this.shiftMonth(1); },

  async save() {
    const bookId = bookUtil.getCurrentBookId();
    const month = this.data.month;
    try {
      const existing = await budgetUtil.getBudgets(bookId, month);
      for (const b of existing) {
        await budgetUtil.removeBudget(bookId, month, b.categoryId);
      }
      let count = 0;
      const total = Number(this.data.totalLimit);
      if (total > 0) {
        await budgetUtil.saveBudget({ bookId, month, categoryId: '', amount: total });
        count++;
      }
      for (const c of this.data.categories) {
        const amount = Number(c.limit);
        if (amount > 0) {
          await budgetUtil.saveBudget({ bookId, month, categoryId: c._id, amount });
          count++;
        }
      }
      ui.toast(count ? '预算已保存' : '预算已清空');
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      ui.toast(e.message || '保存失败', 'none');
    }
  },

  async clearAll() {
    ui.confirmActionWith({ title: '清空预算', content: `确定清空 ${this.data.monthLabel} 的全部预算吗？` }, async (res) => {
        if (!res.confirm) return;
        const bookId = bookUtil.getCurrentBookId();
        const existing = await budgetUtil.getBudgets(bookId, this.data.month);
        for (const b of existing) {
          await budgetUtil.removeBudget(bookId, this.data.month, b.categoryId);
        }
        ui.toast('已清空');
        this.loadData();
      }
    );
  }
});
