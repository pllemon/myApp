const db = require('./db.js');
const dateUtil = require('./date.js');
const checkinUtil = require('./checkin.js');
const diaryUtil = require('./diary.js');
const todoUtil = require('./todo.js');
const bookUtil = require('./book.js');

const MODULE_COLORS = {
  accounting: '#F5A623',
  diary: '#9B59B6',
  checkin: '#52C41A',
  todo: '#4A90D9',
  anniversary: '#FF6B6B',
  wishlist: '#1ABC9C'
};

function monthPrefix(year, month) {
  return year + '-' + (month < 10 ? '0' + month : '' + month);
}

async function loadMonthData(year, month) {
  const prefix = monthPrefix(year, month);

  const [accountingAll, diaryAll, checkinRecords, habits, todoAll, annivAll, wishAll] = await Promise.all([
    db.query(db.COLLECTIONS.ACCOUNTING, { bookId: bookUtil.getCurrentBookId() }),
    db.list(db.COLLECTIONS.DIARY),
    db.list(db.COLLECTIONS.CHECKIN_RECORD),
    db.list(db.COLLECTIONS.CHECKIN_HABIT, { key: 'sortOrder', order: 'asc' }),
    db.list(db.COLLECTIONS.TODO),
    db.list(db.COLLECTIONS.ANNIVERSARY),
    db.list(db.COLLECTIONS.WISHLIST)
  ]);

  const dailyMap = {};
  function ensure(d) {
    if (!dailyMap[d]) {
      dailyMap[d] = { accounting: [], diary: [], checkin: [], checkinHabitIds: {}, todo: [], anniversary: [], wishlist: [] };
    }
    return dailyMap[d];
  }

  accountingAll.forEach(item => {
    const d = dateUtil.bizDateOf(item);
    if (d && d.indexOf(prefix) === 0) ensure(d).accounting.push(item);
  });

  diaryAll.forEach(item => {
    if (item.date && item.date.indexOf(prefix) === 0) ensure(item.date).diary.push(item);
  });

  checkinRecords.forEach(r => {
    if (r.date && r.date.indexOf(prefix) === 0) {
      const day = ensure(r.date);
      if (!day.checkinHabitIds[r.habitId]) {
        day.checkinHabitIds[r.habitId] = true;
        day.checkin.push(r);
      }
    }
  });

  todoAll.forEach(item => {
    if (item.dueDate && item.dueDate.indexOf(prefix) === 0) ensure(item.dueDate).todo.push(item);
  });

  const monthStr = month < 10 ? '0' + month : '' + month;
  annivAll.forEach(item => {
    if (!item.date) return;
    if (item.repeat === 'annual') {
      if (item.date.slice(5, 7) !== monthStr) return;
      const occur = year + '-' + item.date.slice(5);
      const d = new Date(occur + 'T00:00:00');
      if (d.getFullYear() === year && d.getMonth() + 1 === month) ensure(occur).anniversary.push(item);
    } else if (item.date.indexOf(prefix) === 0) {
      ensure(item.date).anniversary.push(item);
    }
  });

  wishAll.forEach(item => {
    if (item.targetDate && item.targetDate.indexOf(prefix) === 0) ensure(item.targetDate).wishlist.push(item);
  });

  return { dailyMap, habits: habits || [] };
}

function getDayDetail(dailyMap, habits, date) {
  const day = dailyMap[date] || { accounting: [], diary: [], checkin: [], checkinHabitIds: {}, todo: [], anniversary: [], wishlist: [] };

  let expense = 0, income = 0;
  (day.accounting || []).forEach(it => {
    if (it.type === 'expense') expense += it.amount || 0;
    else if (it.type === 'income') income += it.amount || 0;
  });

  const checkedHabitIds = day.checkinHabitIds || {};
  const checkinList = (habits || []).map(h => ({
    _id: h._id,
    name: h.name,
    icon: h.icon || 'target',
    color: h.color || '#4A90D9',
    checked: !!checkedHabitIds[h._id]
  }));

  const todoList = (day.todo || []).map(t => {
    const cfg = todoUtil.getPriorityConfig(t.priority);
    return {
      _id: t._id,
      title: t.title || '',
      completed: !!t.completed,
      priorityLabel: cfg.label,
      priorityColor: cfg.color,
      priorityBg: cfg.bg,
      overdue: todoUtil.isOverdue(t)
    };
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0;
  });

  const diaryList = (day.diary || []).map(d => ({
    _id: d._id,
    title: d.title || '无标题',
    summary: diaryUtil.getSummary(d.content, 50),
    mood: d.mood || 'calm',
    weather: d.weather || ''
  }));

  const accountingList = (day.accounting || []).map(it => ({
    _id: it._id,
    type: it.type,
    amount: (it.amount || 0).toFixed(2),
    category: it.category || it.parentCategory || '未分类',
    icon: it.categoryIcon || it.parentCategoryIcon || 'wallet',
    note: it.note || ''
  }));

  const annivList = (day.anniversary || []).map(a => ({
    _id: a._id,
    title: a.title || '',
    icon: a.icon || 'celebrate',
    color: a.color || '#FF6B6B',
    repeatLabel: a.repeat === 'annual' ? '每年' : '单次'
  }));

  const wishList = (day.wishlist || []).map(w => ({
    _id: w._id,
    title: w.title || '',
    icon: w.icon || 'star',
    category: w.category || '愿望',
    achieved: !!w.achieved
  }));

  const checkinDone = checkinList.filter(c => c.checked).length;
  const todoDone = todoList.filter(t => t.completed).length;

  return {
    date,
    dateLabel: diaryUtil.formatDateLabel(date),
    expense: expense.toFixed(2),
    income: income.toFixed(2),
    accounting: accountingList,
    accountingCount: accountingList.length,
    diary: diaryList,
    diaryCount: diaryList.length,
    checkin: checkinList,
    checkinDone,
    checkinTotal: checkinList.length,
    todo: todoList,
    todoDone,
    todoTotal: todoList.length,
    anniversary: annivList,
    anniversaryCount: annivList.length,
    wishlist: wishList,
    wishlistCount: wishList.length,
    isEmpty: accountingList.length === 0 && diaryList.length === 0 && checkinDone === 0 && todoList.length === 0 && annivList.length === 0 && wishList.length === 0
  };
}

function buildMonthCellsWithMarks(year, month, dailyMap, selectedDate, today) {
  const cells = checkinUtil.buildMonthCalendar(year, month);
  return cells.map((c, idx) => {
    if (c.empty) return Object.assign({}, c, { _k: 'e' + idx });
    const day = dailyMap[c.date] || {};
    const marks = [];
    if (day.accounting && day.accounting.length) marks.push(MODULE_COLORS.accounting);
    if (day.diary && day.diary.length) marks.push(MODULE_COLORS.diary);
    if (day.checkin && day.checkin.length) marks.push(MODULE_COLORS.checkin);
    if (day.todo && day.todo.length) marks.push(MODULE_COLORS.todo);
    if (day.anniversary && day.anniversary.length) marks.push(MODULE_COLORS.anniversary);
    if (day.wishlist && day.wishlist.length) marks.push(MODULE_COLORS.wishlist);
    return Object.assign({}, c, {
      _k: c.date,
      isToday: c.date === today,
      isSelected: c.date === selectedDate,
      marks
    });
  });
}

module.exports = {
  MODULE_COLORS,
  loadMonthData,
  getDayDetail,
  buildMonthCellsWithMarks
};