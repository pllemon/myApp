const db = require('./db.js');
const dateUtil = require('./date.js');

const PRIORITY = {
  high: { label: '高', color: '#FF4D4F', bg: '#FFECEC' },
  medium: { label: '中', color: '#FAAD14', bg: '#FFF7E6' },
  low: { label: '低', color: '#52C41A', bg: '#F6FFED' }
};

const PRIORITY_LIST = ['high', 'medium', 'low'];

const LIST_COLORS = ['#4A90D9', '#F5A623', '#7ED321', '#D946EF', '#13C2C2', '#FA8C16', '#1890FF', '#EB2F96'];
const LIST_ICONS = ['📋', '📌', '🎯', '💼', '🏠', '🛒', '📚', '🎁', '✈️', '💡'];

const DEFAULT_LISTS = [
  { id: 'inbox', name: '收集箱', icon: '📋', color: '#4A90D9', builtin: true },
  { id: 'today', name: '今日', icon: '🎯', color: '#F5A623', builtin: true }
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
  return await db.update(db.COLLECTIONS.TODO, todo._id, {
    completed,
    completedAt: completed ? Date.now() : null
  });
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
  const tasks = todos.map(t => db.update(db.COLLECTIONS.TODO, t._id, { listId: null }));
  await Promise.all(tasks);
  return await db.remove(db.COLLECTIONS.TODO_LIST, id);
}

module.exports = {
  PRIORITY,
  PRIORITY_LIST,
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