const db = require('../../../utils/db.js');
const util = require('../../../utils/todo.js');
const ui = require('../../../utils/interaction.js');
const detail = require('../../../utils/detail-page.js');

Page(detail.createDetailPage({
  collection: db.COLLECTIONS.TODO,
  editPath: '/pages/todo/edit/index',
  titleKey: 'title',
  defaultTitle: '待办详情',
  emptyTip: '待办不存在',

  onLoaded(item) {
    const priority = util.getPriorityConfig(item.priority);
    const subs = item.subtasks || [];
    const done = subs.filter(s => s.done).length;
    this.setData({
      quickLabel: item.completed ? '取消完成' : '标记完成',
      priorityLabel: priority.label,
      priorityColor: priority.color,
      priorityBg: priority.bg,
      repeatLabel: util.REPEAT_LABELS[item.repeat] || '',
      dueLabel: item.dueDate ? (item.dueTime ? item.dueDate + ' ' + item.dueTime : item.dueDate) : '',
      overdue: util.isOverdue(item),
      subtaskDone: done,
      subtaskTotal: subs.length,
      subtaskPercent: subs.length ? Math.round(done / subs.length * 100) : 0,
      listName: ''
    });
    if (item.listId) this.loadListName(item.listId);
  },

  extraMethods: {
    async loadListName(id) {
      try {
        const list = await db.getById(db.COLLECTIONS.TODO_LIST, id);
        if (list) this.setData({ listName: list.name });
      } catch (err) {
        console.error('todo detail loadListName error:', err);
      }
    },

    async quickAction() {
      const item = this.data.item;
      if (!item) return;
      try {
        await util.toggleComplete(item);
        ui.toast('已更新');
        await this.loadDetail(false);
      } catch (err) {
        console.error('todo detail quickAction error:', err);
        ui.toast('操作失败', 'none');
      }
    },

    async toggleSubtask(e) {
      const index = Number(e.currentTarget.dataset.index);
      const item = this.data.item;
      if (!item || !item.subtasks || !item.subtasks[index]) return;
      const subtasks = item.subtasks.map((s, i) => (i === index ? { ...s, done: !s.done } : s));
      try {
        await db.update(db.COLLECTIONS.TODO, item._id, { subtasks });
        ui.toast('已更新');
        await this.loadDetail(false);
      } catch (err) {
        console.error('todo detail toggleSubtask error:', err);
        ui.toast('操作失败', 'none');
      }
    }
  }
}));
