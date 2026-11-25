const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const tabConfig = require('../../../utils/tabbar-config.js');
const bookUtil = require('../../../utils/book.js');
const checkinUtil = require('../../../utils/checkin.js');
const todoUtil = require('../../../utils/todo.js');
const anniversaryUtil = require('../../../utils/anniversary.js');

Page({
  data: {
    today: '',
    weekday: '',
    greeting: '',
    mode: 'local',

    checkinHabits: [],
    checkedIds: {},
    checkinDone: 0,
    checkinTotal: 0,

    todoList: [],
    todoDone: 0,
    todoTotal: 0,

    todayDiary: null,
    todayAccounting: [],
    todayExpense: '0.00',
    todayIncome: '0.00',
    todayMovie: null,
    todayReading: null,

    upcomingAnniversaries: [],

    moreModules: [],

    showAddMenu: false
  },

  onLoad() {
    this.initHeader();
  },

  onShow() {
    this.loadAll();
    this.buildMoreModules();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
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
    const today = (now.getMonth() + 1) + '月' + now.getDate() + '日';
    this.setData({ greeting, today, weekday, mode: db.mode });
  },

  async loadAll() {
    const today = dateUtil.today();
    const todayRange = dateUtil.dayRange(today);
    const bookId = bookUtil.getCurrentBookId();

    try {
      const [habits, records, allTodos, diaries, acctList, allAnni, movies, readings] = await Promise.all([
        checkinUtil.loadHabits(),
        checkinUtil.loadAllCheckinRecords(),
        todoUtil.loadTodos(),
        db.list(db.COLLECTIONS.DIARY, { key: 'createdAt', order: 'desc' }),
        db.query(db.COLLECTIONS.ACCOUNTING, { createdAt: todayRange, bookId }),
        anniversaryUtil.loadAnniversaries(),
        db.list(db.COLLECTIONS.MOVIE, { key: 'createdAt', order: 'desc' }),
        db.list(db.COLLECTIONS.READING, { key: 'createdAt', order: 'desc' })
      ]);

      const checkedIds = {};
      records.forEach(r => { if (r.date === today) checkedIds[r.habitId] = true; });

      const habitList = (habits || []).map(h => ({
        ...h,
        done: !!checkedIds[h._id]
      }));

      const todayTodos = (allTodos || [])
        .filter(t => t.dueDate === today)
        .map(t => ({ ...t, overdue: todoUtil.isOverdue(t) }))
        .sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));

      let expense = 0, income = 0;
      (acctList || []).forEach(a => {
        const amt = parseFloat(a.amount) || 0;
        if (a.type === 'expense') expense += amt;
        else income += amt;
      });
      const acctItems = (acctList || []).map(a => ({
        ...a,
        displayAmount: (a.type === 'expense' ? '-' : '+') + '¥' + amtFmt(a.amount),
        icon: a.categoryIcon || a.parentCategoryIcon || '💸'
      }));

      const todayDiary = (diaries || []).find(d => {
        return dateUtil.formatDate(d.createdAt) === today;
      });

      const todayMovie = (movies || []).find(m => {
        return dateUtil.formatDate(m.createdAt) === today && (m.status === 'watched' || m.watchedDate === today);
      });
      const todayReading = (readings || []).find(r => {
        return dateUtil.formatDate(r.createdAt) === today;
      });

      const decoratedAnni = (allAnni || [])
        .map(a => anniversaryUtil.decorate(a, today))
        .filter(a => a.daysUntil >= 0 && a.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

      this.setData({
        checkinHabits: habitList,
        checkedIds,
        checkinTotal: habitList.length,
        checkinDone: habitList.filter(h => h.done).length,

        todoList: todayTodos,
        todoTotal: todayTodos.length,
        todoDone: todayTodos.filter(t => t.completed).length,

        todayDiary: todayDiary ? {
          ...todayDiary,
          preview: (todayDiary.content || '').slice(0, 60)
        } : null,
        todayAccounting: acctItems,
        todayExpense: expense.toFixed(2),
        todayIncome: income.toFixed(2),
        todayMovie: todayMovie || null,
        todayReading: todayReading || null,

        upcomingAnniversaries: decoratedAnni
      });
    } catch (e) {
      console.error('home loadAll error:', e);
    }
  },

  buildMoreModules() {
    const selectedTabIds = new Set(tabConfig.getSelectedIds());
    const candidates = tabConfig.getCandidates();
    const nonSelectedTabModules = candidates
      .filter(c => c.id !== 'home' && c.id !== 'profile' && !selectedTabIds.has(c.id))
      .map(c => ({
        id: c.id,
        icon: c.icon,
        title: c.text,
        path: c.pagePath
      }));

    const shortcutIds = tabConfig.loadShortcutIds();
    const shortcutAll = tabConfig.getShortcutConfig();
    const shortcutModules = shortcutIds
      .map(id => shortcutAll.find(c => c.id === id))
      .filter(Boolean)
      .map(c => ({
        id: c.id,
        icon: c.icon,
        title: c.text,
        path: c.pagePath
      }));

    this.setData({
      moreModules: [...nonSelectedTabModules, ...shortcutModules]
    });
  },

  async toggleCheckin(e) {
    const habitId = e.currentTarget.dataset.id;
    const habit = this.data.checkinHabits.find(h => h._id === habitId);
    if (!habit) return;
    const today = dateUtil.today();

    if (this.data.checkedIds[habitId]) {
      const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, { habitId, date: today });
      if (records && records.length > 0) {
        await db.remove(db.COLLECTIONS.CHECKIN_RECORD, records[0]._id);
      }
    } else {
      await db.add(db.COLLECTIONS.CHECKIN_RECORD, {
        habitId,
        date: today,
        createdAt: Date.now()
      });
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

  goHabitCreate() {
    wx.navigateTo({ url: '/pages/checkin/create/index' });
  },

  goTodoEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/todo/edit/index?id=' + id });
  },

  goDiaryEditor() {
    wx.navigateTo({ url: '/pages/diary/editor/index' });
  },

  goDiaryDetail() {
    if (this.data.todayDiary) {
      wx.navigateTo({ url: '/pages/diary/detail/index?id=' + this.data.todayDiary._id });
    } else {
      wx.navigateTo({ url: '/pages/diary/editor/index' });
    }
  },

  goAccountingEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/accounting/edit/index?id=' + id });
  },

  goPage(e) {
    const path = typeof e === 'string' ? e : (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.path);
    if (!path) return;

    const candidatePaths = new Set(tabConfig.getCandidates().map(c => c.pagePath));
    const fullPath = path.startsWith('/') ? path : '/' + path;
    if (candidatePaths.has(fullPath)) {
      wx.reLaunch({ url: fullPath });
    } else {
      wx.navigateTo({ url: fullPath });
    }
  },

  goCheckinFull() { this.goPage('/pages/checkin/index/index'); },
  goTodoFull() { this.goPage('/pages/todo/index/index'); },
  goMovie() { this.goPage('/pages/movie/index/index'); },
  goReading() { this.goPage('/pages/reading/index/index'); },
  goSearch() { this.goPage('/pages/search/index/index'); },
  goAnni() { this.goPage('/pages/anniversary/index/index'); },

  toggleAddMenu() {
    this.setData({ showAddMenu: !this.data.showAddMenu });
  },

  hideAddMenu() {
    if (this.data.showAddMenu) this.setData({ showAddMenu: false });
  },

  quickAdd(e) {
    this.setData({ showAddMenu: false });
    const type = e.currentTarget.dataset.type;
    const paths = {
      accounting: '/pages/accounting/edit/index',
      diary: '/pages/diary/editor/index',
      todo: '/pages/todo/edit/index'
    };
    const url = paths[type];
    if (!url) return;
    wx.navigateTo({ url });
  }
});

function amtFmt(v) {
  return (Number(v) || 0).toFixed(2);
}