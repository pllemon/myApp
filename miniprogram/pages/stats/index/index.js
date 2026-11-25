const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const checkinUtil = require('../../../utils/checkin.js');
const bookUtil = require('../../../utils/book.js');

const fmt = (n) => (n || 0).toFixed(2);

Page({
  data: {
    monthLabel: '',
    overview: {
      monthExpense: '0.00',
      monthIncome: '0.00',
      monthBalance: '0.00',
      diaryMonth: 0,
      todoDone: 0,
      todoTotal: 0,
      todoRate: 0
    },
    bars: [],
    checkinStats: {
      habitCount: 0,
      todayDone: 0,
      totalCheckins: 0,
      longestStreak: 0,
      currentStreak: 0
    },
    recentTodos: [],
    loading: true
  },

  onShow() {
    this.loadAll();
  },

  async loadAll() {
    this.setData({ loading: true });
    try {
      const cm = dateUtil.currentMonth();
      const range = dateUtil.monthRange(cm.year, cm.month);
      const today = dateUtil.today();
      const bookId = bookUtil.getCurrentBookId();

      const [accounting, diaryMonth, habits, records, todos] = await Promise.all([
        db.query(db.COLLECTIONS.ACCOUNTING, { createdAt: range, bookId }),
        db.count(db.COLLECTIONS.DIARY, { createdAt: range }),
        db.list(db.COLLECTIONS.CHECKIN_HABIT),
        checkinUtil.loadAllCheckinRecords(),
        db.list(db.COLLECTIONS.TODO)
      ]);

      let mExpense = 0, mIncome = 0;
      accounting.forEach(r => {
        if (r.type === 'expense') mExpense += r.amount || 0;
        if (r.type === 'income') mIncome += r.amount || 0;
      });

      const bars = await this.buildWeekBars();

      const allDates = [...new Set(records.map(r => r.date))].sort();
      const streaks = checkinUtil.calcStreaks(allDates);
      const todayDone = new Set(records.filter(r => r.date === today).map(r => r.habitId)).size;

      const doneTodos = todos.filter(t => t.completed);
      const todoRate = todos.length > 0 ? Math.round(doneTodos.length / todos.length * 100) : 0;

      const recentTodos = todos
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
        .map(t => ({ title: t.title, completed: !!t.completed }));

      this.setData({
        monthLabel: cm.label,
        overview: {
          monthExpense: fmt(mExpense),
          monthIncome: fmt(mIncome),
          monthBalance: fmt(mIncome - mExpense),
          diaryMonth,
          todoDone: doneTodos.length,
          todoTotal: todos.length,
          todoRate
        },
        bars,
        checkinStats: {
          habitCount: habits.length,
          todayDone,
          totalCheckins: records.length,
          longestStreak: streaks.longest,
          currentStreak: streaks.current
        },
        recentTodos,
        loading: false
      });
    } catch (e) {
      console.error('stats loadAll error:', e);
      this.setData({ loading: false });
    }
  },

  async buildWeekBars() {
    const bookId = bookUtil.getCurrentBookId();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const ts = Date.now() - i * 86400000;
      const label = dateUtil.formatDate(ts, 'MM-DD');
      const range = { $gte: ts - ts % 86400000, $lte: ts - ts % 86400000 + 86399999 };
      const list = await db.query(db.COLLECTIONS.ACCOUNTING, { createdAt: range, bookId });
      let expense = 0;
      list.forEach(r => { if (r.type === 'expense') expense += r.amount || 0; });
      days.push({ label, value: expense });
    }
    const max = Math.max(...days.map(d => d.value), 0.01);
    return days.map(d => ({
      label: d.label,
      value: d.value.toFixed(2),
      pct: Math.round(d.value / max * 100)
    }));
  }
});