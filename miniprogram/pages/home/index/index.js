// 首页 · 今日驾驶舱
// 一个屏幕回答三个问题：今天花了多少、今天做了什么、本月走得怎么样。
const tabState = require('../../../utils/tab-state.js');
const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const tabConfig = require('../../../utils/tabbar-config.js');
const bookUtil = require('../../../utils/book.js');
const categoryUtil = require('../../../utils/category.js');
const checkinUtil = require('../../../utils/checkin.js');
const todoUtil = require('../../../utils/todo.js');
const anniversaryUtil = require('../../../utils/anniversary.js');
const budgetUtil = require('../../../utils/budget.js');
const theme = require('../../../utils/theme.js');

// 速记条固定入口：覆盖最高频的「想到就记」场景
const QUICK_ACTIONS = [
  { id: 'accounting', label: '记一笔', path: '/pages/accounting/edit/index' },
  { id: 'diary', label: '写日记', path: '/pages/diary/editor/index' },
  { id: 'todo', label: '加待办', path: '/pages/todo/edit/index' },
  { id: 'health', label: '记健康', path: '/pages/health/index/index' },
  { id: 'checkin', label: '去打卡', path: '/pages/checkin/index/index' }
];

Page({
  behaviors: [tabState.behavior],

  data: {
    themeStyle: '',
    palette: ['#FF6B6B', '#FFA94D', '#FFD43B', '#51CF66', '#22B8CF', '#4DABF7', '#9775FA'],

    // 顶部驾驶舱
    greeting: '',
    dateLabel: '',
    weekday: '',
    mode: 'local',
    cockpit: {
      expense: '0.00',
      income: '0.00',
      budgetLeft: '--',
      budgetPercent: 0,
      hasBudget: false
    },
    cockpitStats: [],

    // 速记
    quickActions: QUICK_ACTIONS,

    // 今日进度
    checkinHabits: [],
    checkinDone: 0,
    checkinTotal: 0,
    checkinPercent: 0,
    todoList: [],
    todoDone: 0,
    todoTotal: 0,
    todoPercent: 0,

    // 本月小报
    monthLabel: '',
    monthDigest: [],

    // 今日时间线
    timeline: [],

    // 近期日子
    upcomingAnniversaries: [],

    // 更多入口
    moreModules: []
  },

  onLoad() {
    this.initHeader();
  },

  onShow() {
    this.refreshTheme();
    this.loadAll();
    this.buildMoreModules();
  },

  onPullDownRefresh() {
    this.refreshTheme();
    Promise.all([this.loadAll(), Promise.resolve(this.buildMoreModules())])
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },

  refreshTheme() {
    const t = theme.getActiveTheme();
    this.setData({
      palette: (t.categoryColors && t.categoryColors.length ? t.categoryColors : this.data.palette).slice()
    });
  },

  initHeader() {
    const now = new Date();
    const hour = now.getHours();
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    let greeting = '';
    if (hour < 6) greeting = '夜深了';
    else if (hour < 12) greeting = '早上好';
    else if (hour < 14) greeting = '中午好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    this.setData({
      greeting,
      dateLabel: (now.getMonth() + 1) + '月' + now.getDate() + '日',
      weekday,
      mode: db.mode,
      monthLabel: (now.getMonth() + 1) + '月'
    });
  },

  async loadAll() {
    const today = dateUtil.today();
    const month = today.slice(0, 7);
    const bookId = bookUtil.getCurrentBookId();
    const categoryMap = categoryUtil.buildCategoryMap(bookId);

    try {
      const [
        habits, records, allTodos, diaries, acctList, allAnni, movies, readings,
        profiles, waters, weights, bps, budgetStatus
      ] = await Promise.all([
        checkinUtil.loadHabits(),
        checkinUtil.loadAllCheckinRecords(),
        todoUtil.loadTodos(),
        db.list(db.COLLECTIONS.DIARY, { key: 'createdAt', order: 'desc' }),
        db.query(db.COLLECTIONS.ACCOUNTING, { bookId }),
        anniversaryUtil.loadAnniversaries(),
        db.list(db.COLLECTIONS.MOVIE, { key: 'createdAt', order: 'desc' }),
        db.list(db.COLLECTIONS.READING, { key: 'createdAt', order: 'desc' }),
        db.list(db.COLLECTIONS.HEALTH_PROFILE, { key: 'createdAt', order: 'desc' }),
        db.list(db.COLLECTIONS.HEALTH_WATER, { key: 'createdAt', order: 'desc' }),
        db.list(db.COLLECTIONS.HEALTH_WEIGHT, { key: 'createdAt', order: 'desc' }),
        db.list(db.COLLECTIONS.HEALTH_BP, { key: 'createdAt', order: 'desc' }),
        budgetUtil.getStatus(bookId, month)
      ]);

      const profileId = (profiles && profiles[0] && profiles[0]._id) || '';
      const inProfile = (list) => (list || []).filter(i => !profileId || i.profileId === profileId);

      // —— 今日进度 ——
      const checkedIds = {};
      records.forEach(r => { if (r.date === today) checkedIds[r.habitId] = true; });
      const habitList = (habits || []).map(h => ({ ...h, done: !!checkedIds[h._id] }));
      const palette = this.data.palette;
      const todayTodos = (allTodos || [])
        .filter(t => t.dueDate === today)
        .map(t => ({
          ...t,
          overdue: todoUtil.isOverdue(t),
          checkStyle: t.completed ? 'background:' + palette[5] + ';border-color:' + palette[5] : ''
        }))
        .sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));

      const checkinDone = habitList.filter(h => h.done).length;
      const todoDone = todayTodos.filter(t => t.completed).length;
      const checkinPercent = habitList.length ? Math.round(checkinDone / habitList.length * 100) : 0;
      const todoPercent = todayTodos.length ? Math.round(todoDone / todayTodos.length * 100) : 0;

      // —— 今日账目 ——
      const todayAcct = (acctList || []).filter(a => dateUtil.isBizToday(a, today));
      let expense = 0, income = 0;
      todayAcct.forEach(a => {
        const amt = parseFloat(a.amount) || 0;
        if (a.type === 'expense') expense += amt;
        else income += amt;
      });

      // —— 本月小报 ——
      const monthAcct = (acctList || []).filter(a => dateUtil.bizMonthOf(a) === month);
      const monthExpense = monthAcct.filter(a => a.type === 'expense')
        .reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
      const monthIncome = monthAcct.filter(a => a.type === 'income')
        .reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
      const diaryDays = new Set((diaries || [])
        .filter(d => dateUtil.bizMonthOf(d) === month)
        .map(d => dateUtil.bizDateOf(d))).size;
      const monthCheckins = (records || []).filter(r => String(r.date || '').slice(0, 7) === month).length;
      const totalBudget = (budgetStatus || []).find(b => !b.categoryId);
      const budgetPercent = totalBudget && totalBudget.limit > 0
        ? Math.min(100, Math.round(totalBudget.spent / totalBudget.limit * 100)) : 0;
      const budgetLeft = totalBudget && totalBudget.limit > 0
        ? (totalBudget.limit - totalBudget.spent).toFixed(2) : '--';

      // —— 今日健康速览 ——
      const todayWaters = inProfile(waters).filter(w => w.date === today);
      const waterToday = todayWaters.reduce((s, w) => s + (Number(w.amount) || 0), 0);
      const waterGoal = (profiles && profiles[0] && profiles[0].waterGoal) || 2000;
      const weightList = inProfile(weights).slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      const latestWeight = weightList.length ? weightList[weightList.length - 1].weight : null;
      const bpList = inProfile(bps).slice().sort((a, b) => {
        const ka = String(a.date || '') + String(a.time || '');
        const kb = String(b.date || '') + String(b.time || '');
        return ka.localeCompare(kb);
      });
      const latestBp = bpList.length ? bpList[bpList.length - 1] : null;
      const waterPercent = Math.min(100, Math.round(waterToday / waterGoal * 100));

      const cockpitStats = [
        { key: 'checkin', label: '打卡', value: habitList.length ? checkinDone + '/' + habitList.length : '--', icon: 'check', color: palette[3], path: '/pages/checkin/index/index' },
        { key: 'todo', label: '待办', value: todayTodos.length ? todoDone + '/' + todayTodos.length : '--', icon: 'list', color: palette[5], path: '/pages/todo/index/index' },
        { key: 'diary', label: '日记', value: (diaries || []).some(d => dateUtil.isBizToday(d, today)) ? '已写' : '未写', icon: 'note', color: palette[2], path: '/pages/diary/index/index' },
        { key: 'water', label: '饮水', value: waterToday ? waterToday + 'ml' : '--', icon: 'pulse', color: palette[4], path: '/pages/health/index/index' }
      ];

      const monthDigest = [
        { label: '本月支出', value: '¥' + monthExpense.toFixed(0), icon: 'wallet', color: palette[0] },
        { label: '本月收入', value: '¥' + monthIncome.toFixed(0), icon: 'salary', color: palette[3] },
        { label: '记账笔数', value: String(monthAcct.length), icon: 'bill', color: palette[1] },
        { label: '记录天数', value: String(diaryDays), icon: 'calendar', color: palette[5] },
        { label: '打卡次数', value: String(monthCheckins), icon: 'check', color: palette[4] },
        { label: '预算余量', value: totalBudget ? '¥' + Math.max(0, totalBudget.limit - totalBudget.spent).toFixed(0) : '--', icon: 'chart', color: palette[6] }
      ];

      // —— 今日时间线：把散落各模块的一条条「今天」收成一条线 ——
      const timeline = [];
      const addEvent = (o) => {
        if (!o) return;
        timeline.push(o);
      };
      todayAcct.forEach(a => {
        addEvent({
          key: 'acct-' + a._id,
          time: timeOf(a, '12:00'),
          title: a.category || '未分类',
          subtitle: a.note || '',
          amount: (a.type === 'expense' ? '-' : '+') + '¥' + amtFmt(a.amount),
          icon: 'wallet',
          color: a.type === 'expense' ? palette[0] : palette[3],
          path: '/pages/accounting/edit/index?id=' + a._id
        });
      });
      const todayDiary = (diaries || []).find(d => dateUtil.isBizToday(d, today));
      if (todayDiary) {
        addEvent({
          key: 'diary-' + todayDiary._id,
          time: timeOf(todayDiary, '21:00'),
          title: todayDiary.title || '无标题日记',
          subtitle: (todayDiary.content || '').slice(0, 30),
          amount: '',
          icon: 'note',
          color: palette[2],
          path: '/pages/diary/detail/index?id=' + todayDiary._id
        });
      }
      records.filter(r => r.date === today).forEach(r => {
        const h = habitList.find(x => x._id === r.habitId);
        addEvent({
          key: 'checkin-' + r._id,
          time: timeOf(r, '08:00'),
          title: (h && h.name) || '习惯打卡',
          subtitle: '已完成打卡',
          amount: '',
          icon: 'check',
          color: palette[3],
          path: '/pages/checkin/index/index'
        });
      });
      todayTodos.filter(t => t.completed).forEach(t => {
        addEvent({
          key: 'todo-' + t._id,
          time: timeOf(t, '09:00'),
          title: t.title || '待办',
          subtitle: '已完成',
          amount: '',
          icon: 'list',
          color: palette[5],
          path: '/pages/todo/detail/index?id=' + t._id
        });
      });
      todayWaters.forEach(w => {
        addEvent({
          key: 'water-' + w._id,
          time: timeOf(w, '10:00'),
          title: '饮水 ' + (Number(w.amount) || 0) + 'ml',
          subtitle: '',
          amount: '',
          icon: 'pulse',
          color: palette[4],
          path: '/pages/health/water/index'
        });
      });
      const todayMovie = (movies || []).find(m => m.status === 'watched' && dateUtil.isBizToday(m, today));
      if (todayMovie) {
        addEvent({
          key: 'movie-' + todayMovie._id,
          time: timeOf(todayMovie, '20:00'),
          title: todayMovie.title || '观影',
          subtitle: '已观影',
          amount: '',
          icon: 'play',
          color: palette[1],
          path: '/pages/movie/detail/index?id=' + todayMovie._id
        });
      }
      const todayReading = (readings || []).find(r => dateUtil.isBizToday(r, today));
      if (todayReading) {
        addEvent({
          key: 'reading-' + todayReading._id,
          time: timeOf(todayReading, '21:30'),
          title: todayReading.title || '阅读',
          subtitle: '读书笔记',
          amount: '',
          icon: 'bookline',
          color: palette[6],
          path: '/pages/reading/detail/index?id=' + todayReading._id
        });
      }
      timeline.sort((a, b) => String(a.time).localeCompare(String(b.time)));

      const decoratedAnni = (allAnni || [])
        .map(a => anniversaryUtil.decorate(a, today))
        .filter(a => a.daysUntil >= 0 && a.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

      this.setData({
        cockpit: {
          expense: expense.toFixed(2),
          income: income.toFixed(2),
          budgetLeft,
          budgetPercent,
          hasBudget: !!(totalBudget && totalBudget.limit > 0)
        },
        cockpitStats,
        checkinHabits: habitList,
        checkinDone,
        checkinTotal: habitList.length,
        checkinPercent,
        todoList: todayTodos,
        todoDone,
        todoTotal: todayTodos.length,
        todoPercent,
        monthDigest,
        timeline: timeline.slice(-8),
        upcomingAnniversaries: decoratedAnni
      });
    } catch (e) {
      console.error('home loadAll error:', e);
    }
  },

  buildMoreModules() {
    const candidates = tabConfig.getCandidates();
    const moreModules = tabConfig.getMoreIds()
      .map(id => candidates.find(c => c.id === id))
      .filter(Boolean)
      .map(c => ({ id: c.id, title: c.text, path: c.pagePath }));
    this.setData({ moreModules });
  },

  async toggleCheckin(e) {
    const habitId = e.currentTarget.dataset.id;
    const habit = this.data.checkinHabits.find(h => h._id === habitId);
    if (!habit) return;
    const today = dateUtil.today();
    if (this.data.checkinHabits.find(h => h._id === habitId).done) {
      const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, { habitId, date: today });
      if (records && records.length > 0) await db.remove(db.COLLECTIONS.CHECKIN_RECORD, records[0]._id);
    } else {
      await db.add(db.COLLECTIONS.CHECKIN_RECORD, { habitId, date: today, createdAt: Date.now() });
    }
    this.loadAll();
  },

  async toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    const todo = this.data.todoList.find(t => t._id === id);
    if (!todo) return;
    await db.update(db.COLLECTIONS.TODO, id, { completed: !todo.completed });
    this.loadAll();
  },

  goPage(e) {
    const path = typeof e === 'string' ? e
      : (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.path);
    if (!path) return;
    const candidatePaths = new Set(tabConfig.getCandidates().map(c => c.pagePath));
    const fullPath = path.startsWith('/') ? path : '/' + path;
    if (candidatePaths.has(fullPath)) wx.reLaunch({ url: fullPath });
    else wx.navigateTo({ url: fullPath });
  },

  goCheckinFull() { this.goPage('/pages/checkin/index/index'); },
  goTodoFull() { this.goPage('/pages/todo/index/index'); },
  goStats() { this.goPage('/pages/stats/index/index'); },
  goTimeline() { this.goPage('/pages/timeline/index/index'); },
  goAnni() { this.goPage('/pages/anniversary/index/index'); },
  goAnniDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/anniversary/detail/index?id=' + id });
  },
  goHabitCreate() { wx.navigateTo({ url: '/pages/checkin/create/index' }); }
});

function amtFmt(v) {
  return (Number(v) || 0).toFixed(2);
}

function timeOf(item, fallback) {
  if (item && typeof item.time === 'string' && /^\d{1,2}:\d{2}/.test(item.time)) {
    return item.time.slice(0, 5);
  }
  if (item && item.createdAt) return dateUtil.formatDate(item.createdAt, 'HH:mm');
  return fallback || '';
}
