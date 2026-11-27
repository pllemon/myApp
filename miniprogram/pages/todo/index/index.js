const tabState = require('../../../utils/tab-state.js');
const ui = require('../../../utils/interaction.js');
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
  behaviors: [tabState.behavior],
  noop() {},
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
    editingSubtask: null,
    showListManager: false,
    newListName: ''
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

      // 清单计数：供管理弹层展示"该清单下有多少待办"
      const listCounts = {};
      all.forEach(t => { if (t.listId) listCounts[t.listId] = (listCounts[t.listId] || 0) + 1; });
      const listsWithCount = this.data.lists.map(l => ({ ...l, todoCount: listCounts[l._id] || 0 }));

      const decorated = filtered.map(t => this.decorate(t, today));
      decorated.sort(this.sortTasks);

      this.setData({
        list: decorated,
        lists: listsWithCount,
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
      repeatLabel: todoUtil.REPEAT_LABELS[t.repeat] || '',
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
      const patch = await todoUtil.toggleComplete(todo);
      if (patch && patch.cycleCount && patch.dueDate) {
        ui.toast('下次：' + patch.dueDate.slice(5), 'none');
      }
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

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/todo/detail/index?id=' + (id || '') });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/todo/edit/index' });
  },

  goPomodoro() {
    wx.navigateTo({ url: '/pages/todo/pomodoro/index' });
  },

  /* ===== 清单管理（新增 / 重命名 / 删除） ===== */

  toggleListManager() {
    this.setData({ showListManager: !this.data.showListManager, newListName: '' });
  },

  onNewListInput(e) {
    this.setData({ newListName: e.detail.value });
  },

  async addList() {
    const name = (this.data.newListName || '').trim();
    if (!name) {
      ui.toast('请输入清单名称', 'none');
      return;
    }
    if (this.data.lists.some(l => l.name === name)) {
      ui.toast('清单名称已存在', 'none');
      return;
    }
    const idx = this.data.lists.length;
    try {
      await todoUtil.saveList({
        name,
        icon: todoUtil.LIST_ICONS[idx % todoUtil.LIST_ICONS.length],
        color: todoUtil.LIST_COLORS[idx % todoUtil.LIST_COLORS.length]
      });
      this.setData({ newListName: '' });
      await this.loadLists();
      ui.toast('清单已创建');
    } catch (e) {
      console.error('addList error:', e);
      ui.toast('创建失败', 'none');
    }
  },

  async renameList(e) {
    const { id, name } = e.currentTarget.dataset;
    const newName = await ui.promptInput({
      title: '重命名清单',
      value: name,
      placeholder: '请输入新名称',
      required: true,
      emptyTip: '名称不能为空'
    });
    if (newName === null) return;
    if (this.data.lists.some(l => l.name === newName && l._id !== id)) {
      ui.toast('清单名称已存在', 'none');
      return;
    }
    try {
      await todoUtil.saveList({ _id: id, name: newName });
      const patch = {};
      if (this.data.listFilterId === id) patch.listFilterName = newName;
      this.setData(patch);
      await this.loadLists();
      ui.toast('已重命名');
    } catch (err) {
      console.error('renameList error:', err);
      ui.toast('重命名失败', 'none');
    }
  },

  deleteList(e) {
    const { id, name } = e.currentTarget.dataset;
    const list = this.data.lists.find(l => l._id === id);
    if (list && list.builtin) {
      ui.toast('内置清单不可删除', 'none');
      return;
    }
    const count = list ? (list.todoCount || 0) : 0;
    ui.confirmDeleteWith({ title: '删除清单', content: count > 0 ? `删除「${name}」会一并删除其中 ${count} 个待办，且无法恢复。` : `确定删除清单「${name}」吗？` }, async res => {
        if (!res.confirm) return;
        try {
          await todoUtil.removeList(id);
          const patch = {};
          if (this.data.listFilterId === id) {
            patch.listFilterId = '';
            patch.listFilterName = '全部';
          }
          this.setData(patch);
          await this.loadLists();
          ui.toast('清单已删除');
        } catch (err) {
          console.error('deleteList error:', err);
          ui.toast('删除失败', 'none');
        }
      }
    );
  },

  toggleTagFilter(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ tagFilter: this.data.tagFilter === tag ? '' : tag });
    this.loadList();
  }
});