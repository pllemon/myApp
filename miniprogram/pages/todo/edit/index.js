const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const todoUtil = require('../../../utils/todo.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    note: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    remind: false,
    listId: '',
    tags: [],
    newTag: '',
    subtasks: [],
    newSubtask: '',
    images: [],
    priorityOptions: todoUtil.PRIORITY_LIST.map(key => ({
      key,
      label: todoUtil.getPriorityConfig(key).label,
      color: todoUtil.getPriorityConfig(key).color,
      bg: todoUtil.getPriorityConfig(key).bg
    })),
    lists: [],
    showListPicker: false,
    today: ''
  },

  onLoad(options) {
    const today = dateUtil.today();
    this.setData({ today });
    this.loadLists();
    if (options && options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.loadTodo(options.id);
    }
  },

  async loadLists() {
    const lists = await todoUtil.loadLists();
    this.setData({ lists });
  },

  async loadTodo(id) {
    try {
      const todo = await db.getById(db.COLLECTIONS.TODO, id);
      if (todo) {
        this.setData({
          title: todo.title || '',
          note: todo.note || '',
          priority: todo.priority || 'medium',
          dueDate: todo.dueDate || '',
          dueTime: todo.dueTime || '',
          remind: !!todo.remind,
          listId: todo.listId || '',
          tags: todo.tags || [],
          subtasks: todo.subtasks || [],
          images: todo.images || []
        });
      }
    } catch (e) {
      console.error('loadTodo error:', e);
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },
  onNewTagInput(e) { this.setData({ newTag: e.detail.value }); },
  onNewSubtaskInput(e) { this.setData({ newSubtask: e.detail.value }); },

  selectPriority(e) { this.setData({ priority: e.currentTarget.dataset.key }); },

  onDateChange(e) { this.setData({ dueDate: e.detail.value }); },
  clearDate() { this.setData({ dueDate: '', dueTime: '' }); },
  onTimeChange(e) { this.setData({ dueTime: e.detail.value }); },
  clearTime() { this.setData({ dueTime: '' }); },

  toggleRemind(e) { this.setData({ remind: e.detail.value }); },

  openListPicker() { this.setData({ showListPicker: true }); },
  closeListPicker() { this.setData({ showListPicker: false }); },
  selectList(e) {
    this.setData({ listId: e.currentTarget.dataset.id, showListPicker: false });
  },
  clearList() { this.setData({ listId: '', showListPicker: false }); },

  addTag() {
    const raw = this.data.newTag.trim();
    if (!raw) return;
    const tags = [...this.data.tags];
    if (!tags.includes(raw)) tags.push(raw);
    this.setData({ tags, newTag: '' });
  },
  removeTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ tags: this.data.tags.filter(t => t !== tag) });
  },

  addSubtask() {
    const title = this.data.newSubtask.trim();
    if (!title) return;
    const subtasks = [...this.data.subtasks, { title, done: false }];
    this.setData({ subtasks, newSubtask: '' });
  },
  onSubtaskTitle(e) {
    const idx = e.currentTarget.dataset.index;
    const key = `subtasks[${idx}].title`;
    this.setData({ [key]: e.detail.value });
  },
  toggleSubtask(e) {
    const idx = e.currentTarget.dataset.index;
    const key = `subtasks[${idx}].done`;
    this.setData({ [key]: e.detail.value });
  },
  removeSubtask(e) {
    const idx = e.currentTarget.dataset.index;
    const subtasks = this.data.subtasks.filter((_, i) => i !== idx);
    this.setData({ subtasks });
  },

  async chooseImages() {
    const paths = await imageUtil.chooseImages(this.data.images.length);
    if (paths.length > 0) {
      this.setData({ images: [...this.data.images, ...paths] });
    }
  },
  previewImage(e) {
    imageUtil.preview(e.currentTarget.dataset.index, this.data.images);
  },
  removeImage(e) {
    this.setData({ images: imageUtil.removeAt(this.data.images, e.currentTarget.dataset.index) });
  },

  async save() {
    const title = (this.data.title || '').trim();
    if (!title) {
      wx.showToast({ title: '请输入待办内容', icon: 'none' });
      return;
    }
    const subtasks = this.data.subtasks
      .filter(s => s.title && s.title.trim())
      .map(s => ({ ...s, title: s.title.trim() }));

    const record = {
      title,
      priority: this.data.priority,
      dueDate: this.data.dueDate,
      dueTime: this.data.dueTime,
      remind: this.data.remind && !!this.data.dueTime,
      note: (this.data.note || '').trim(),
      listId: this.data.listId || null,
      tags: this.data.tags,
      subtasks,
      images: this.data.images
    };
    try {
      if (this.data.isEdit) {
        const old = await db.getById(db.COLLECTIONS.TODO, this.data.id);
        if (old) imageUtil.cleanOldImages(old.images || [], record.images);
        await db.update(db.COLLECTIONS.TODO, this.data.id, record);
      } else {
        await db.add(db.COLLECTIONS.TODO, Object.assign({ completed: false }, record));
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error('save todo error:', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  remove() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const old = await db.getById(db.COLLECTIONS.TODO, this.data.id);
          if (old) imageUtil.cleanAllImages(old.images);
          await db.remove(db.COLLECTIONS.TODO, this.data.id);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 500);
        } catch (e) {
          console.error('remove todo error:', e);
        }
      }
    });
  }
});