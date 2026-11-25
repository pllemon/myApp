const dateUtil = require('../../../utils/date.js');
const todoUtil = require('../../../utils/todo.js');
const db = require('../../../utils/db.js');

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今日' },
  { key: 'overdue', label: '逾期' },
  { key: 'done', label: '已完成' }
];

Page({
  data: {
    filters: FILTERS,
    activeFilter: 'all',
    listFilterId: '',
    listFilterName: '',
    lists: [],
    allListName: '全部',
    tagFilter: '',
    availableTags: [],
    list: [],
    todayDone: 0,
    todayTotal: 0,
    showEmpty: false,
    editingSubtask: null
  },

  onLoad() {},

  onShow() {
    this.loadLists();
  },

  async loadLists() {
    const lists = await todoUtil.loadLists();
    this.setData({ lists }, () => this.loadList());
  },

  async loadList() {
    try {
      const all = await todoUtil.loadTodos();
      const today = dateUtil.today();

      let filtered = all;
      if (this.data.listFilterId) {
        filtered = filtered.filter(t => t.listId === this.data.listFilterId);
      }

      if (this.data.activeFilter === 'today') {
        filtered = filtered.filter(t => t.dueDate === today);
      } else if (this.data.activeFilter === 'overdue') {
        filtered = filtered.filter(t => todoUtil.isOverdue(t));
      } else if (this.data.activeFilter === 'done') {
        filtered = filtered.filter(t => t.completed);
      } else {
        filtered = filtered.filter(t => !t.completed);
      }

      if (this.data.tagFilter) {
        filtered = filtered.filter(t => t.tags && t.tags.includes(this.data.tagFilter));
      }

      const tagSet = new Set();
      all.forEach(t => (t.tags || []).forEach(tg => tagSet.add(tg)));
      const availableTags = Array.from(tagSet).sort();

      const decorated = filtered.map(t => this.decorate(t, today));
      decorated.sort(this.sortTasks);

      this.setData({
        list: decorated,
        todayDone: all.filter(t => t.completed && t.dueDate === today).length,
        todayTotal: all.filter(t => t.dueDate === today).length,
        availableTags,
        showEmpty: decorated.length === 0
      });
    } catch (e) {
      console.error('todo loadList error:', e);
    }
  },

  decorate(t, today) {
    const p = todoUtil.getPriorityConfig(t.priority);
    const overdue = todoUtil.isOverdue(t);
    const soon = todoUtil.isDueSoon(t);
    const sp = todoUtil.computeSubtaskProgress(t.subtasks);
    let dueLabel = '';
    let dueClass = '';
    if (t.dueDate) {
      if (t.dueDate === today) {
        dueLabel = t.dueTime ? `今天 ${t.dueTime}` : '今天';
        dueClass = soon ? 'due-soon' : 'due-today';
      } else if (overdue) {
        dueLabel = t.dueTime ? `逾期 ${t.dueDate.slice(5)} ${t.dueTime}` : `逾期 ${t.dueDate.slice(5)}`;
        dueClass = 'due-overdue';
      } else {
        dueLabel = t.dueTime ? `${t.dueDate.slice(5)} ${t.dueTime}` : t.dueDate.slice(5);
      }
    }
    let listName = '';
    const list = this.data.lists.find(l => l._id === t.listId);
    if (list) listName = list.name;
    return {
      ...t,
      priorityLabel: p.label,
      priorityColor: p.color,
      priorityBg: p.bg,
      overdue,
      soon,
      dueLabel,
      dueClass,
      listName,
      subtaskDone: sp.done,
      subtaskTotal: sp.total,
      subtaskRatio: Math.round(sp.ratio * 100),
      subtaskProgressWidth: Math.round(sp.ratio * 100) + '%'
    };
  },

  sortTasks(a, b) {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed) {
      const pOrder = { high: 0, medium: 1, low: 2 };
      if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
    }
    return b.createdAt - a.createdAt;
  },

  switchFilter(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeFilter: key, tagFilter: '' });
    this.loadList();
  },

  async selectListTab(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({ listFilterId: id, listFilterName: name });
    this.loadList();
  },

  async toggleComplete(e) {
    const { id } = e.currentTarget.dataset;
    const todo = this.data.list.find(t => t._id === id);
    if (!todo) return;
    try {
      await todoUtil.toggleComplete(todo);
      this.loadList();
    } catch (err) {
      console.error('toggleComplete error:', err);
    }
  },

  async toggleSubtask(e) {
    const { id, subidx } = e.currentTarget.dataset;
    const todo = this.data.list.find(t => t._id === id);
    if (!todo || !todo.subtasks) return;
    const subtasks = todo.subtasks.map((s, i) => i === subidx ? { ...s, done: !s.done } : s);
    try {
      const doneCount = subtasks.filter(s => !s.done).length;
      const autoComplete = doneCount === 0 && subtasks.length > 0 && !todo.completed;
      const patch = { subtasks };
      if (autoComplete) {
        patch.completed = true;
        patch.completedAt = Date.now();
      }
      await db.update(db.COLLECTIONS.TODO, id, patch);
      this.loadList();
    } catch (err) {
      console.error('toggleSubtask error:', err);
    }
  },

  goEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/todo/edit/index?id=' + (id || '') });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/todo/edit/index' });
  },

  goPomodoro() {
    wx.navigateTo({ url: '/pages/todo/pomodoro/index' });
  },

  toggleTagFilter(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ tagFilter: this.data.tagFilter === tag ? '' : tag });
    this.loadList();
  }
});