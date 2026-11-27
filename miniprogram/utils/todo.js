const db = require('./db.js');
const dateUtil = require('./date.js');
const imageUtil = require('./image.js');

const PRIORITY = {
  high: { label: '高', color: '#FF4D4F', bg: '#FFECEC' },
  medium: { label: '中', color: '#FAAD14', bg: '#FFF7E6' },
  low: { label: '低', color: '#52C41A', bg: '#F6FFED' }
};

const PRIORITY_LIST = ['high', 'medium', 'low'];

const REPEAT_OPTIONS = [
  { key: 'none', label: '不重复' },
  { key: 'daily', label: '每天' },
  { key: 'weekdays', label: '工作日' },
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' }
];

const REPEAT_LABELS = {
  none: '', daily: '每天', weekdays: '工作日', weekly: '每周', monthly: '每月'
};

function pad2(n) { return n < 10 ? '0' + n : String(n); }

function nextDueDate(rule, fromDate) {
  if (!rule || rule === 'none') return '';
  const base = fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)
    ? fromDate : dateUtil.today();
  const d = new Date(base + 'T12:00:00');
  if (isNaN(d.getTime())) return '';

  if (rule === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (rule === 'weekdays') {
    do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  } else if (rule === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (rule === 'monthly') {
    const day = d.getDate();
    const target = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, maxDay));
    return `${target.getFullYear()}-${pad2(target.getMonth() + 1)}-${pad2(target.getDate())}`;
  } else {
    return '';
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const LIST_COLORS = ['#4A90D9', '#F5A623', '#7ED321', '#D946EF', '#13C2C2', '#FA8C16', '#1890FF', '#EB2F96'];
const LIST_ICONS = ['note', 'pin', 'target', 'work', 'home', 'shopping', 'book', 'gift', 'travel', 'idea'];

const DEFAULT_LISTS = [
  { id: 'inbox', name: '收集箱', icon: 'note', color: '#4A90D9', builtin: true },
  { id: 'today', name: '今日', icon: 'target', color: '#F5A623', builtin: true }
];

function getPriorityConfig(p) {
  return PRIORITY[p] || PRIORITY.medium;
}

function isOverdue(todo) {
  if (!todo || todo.completed) return false;
  if (!todo.dueDate) return false;
  if (todo.dueDate < dateUtil.today()) return true;
  if (todo.dueDate === dateUtil.today() && todo.dueTime) {
    const now = new Date();
    const [h, m] = todo.dueTime.split(':').map(Number);
    const due = new Date();
    due.setHours(h || 0, m || 0, 0, 0);
    return now > due;
  }
  return false;
}

function isToday(todo) {
  return todo && todo.dueDate === dateUtil.today();
}

function isDueSoon(todo) {
  if (!todo || todo.completed || !todo.dueDate) return false;
  if (isOverdue(todo)) return false;
  if (todo.dueDate > dateUtil.today()) return false;
  if (!todo.dueTime) return false;
  const [h, m] = todo.dueTime.split(':').map(Number);
  const due = new Date();
  due.setHours(h || 0, m || 0, 0, 0);
  const diff = due - new Date();
  return diff > 0 && diff <= 30 * 60 * 1000;
}

function computeSubtaskProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) return { done: 0, total: 0, ratio: 0 };
  const done = subtasks.filter(s => s.done).length;
  return { done, total: subtasks.length, ratio: done / subtasks.length };
}

async function loadTodos() {
  return await db.list(db.COLLECTIONS.TODO, { key: 'createdAt', order: 'desc' });
}

async function toggleComplete(todo) {
  const completed = !todo.completed;
  const patch = {
    completed,
    completedAt: completed ? Date.now() : null
  };
  // 重复任务：勾选后不消失，直接推进到下一周期（重置完成态与子任务）
  if (completed && todo.repeat && todo.repeat !== 'none') {
    const next = nextDueDate(todo.repeat, todo.dueDate || dateUtil.today());
    patch.completed = false;
    patch.completedAt = null;
    patch.dueDate = next || todo.dueDate;
    patch.lastCompletedAt = Date.now();
    patch.cycleCount = (todo.cycleCount || 0) + 1;
    patch.subtasks = (todo.subtasks || []).map(s => ({ ...s, done: false }));
  }
  await db.update(db.COLLECTIONS.TODO, todo._id, patch);
  return patch;
}

async function loadLists() {
  const lists = await db.list(db.COLLECTIONS.TODO_LIST, { key: 'order', order: 'asc' });
  if (lists.length === 0) {
    const built = DEFAULT_LISTS.map((l, i) => ({ ...l, order: i, createdAt: Date.now() }));
    for (const l of built) await db.add(db.COLLECTIONS.TODO_LIST, l);
    return built;
  }
  return lists;
}

async function saveList(list) {
  if (list._id) {
    await db.update(db.COLLECTIONS.TODO_LIST, list._id, list);
    return list;
  }
  const order = Date.now();
  const id = await db.add(db.COLLECTIONS.TODO_LIST, { ...list, order, createdAt: Date.now() });
  return { ...list, _id: id };
}

async function removeList(id) {
  const todos = await db.query(db.COLLECTIONS.TODO, { listId: id });
  for (const t of todos) {
    if (t.images) imageUtil.cleanAllImages(t.images);
    await db.remove(db.COLLECTIONS.TODO, t._id);
  }
  return await db.remove(db.COLLECTIONS.TODO_LIST, id);
}

module.exports = {
  PRIORITY,
  PRIORITY_LIST,
  REPEAT_OPTIONS,
  REPEAT_LABELS,
  nextDueDate,
  LIST_COLORS,
  LIST_ICONS,
  DEFAULT_LISTS,
  getPriorityConfig,
  isOverdue,
  isToday,
  isDueSoon,
  computeSubtaskProgress,
  loadTodos,
  toggleComplete,
  loadLists,
  saveList,
  removeList
};