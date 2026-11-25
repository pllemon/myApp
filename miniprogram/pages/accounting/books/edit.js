const bookUtil = require('../../../utils/book.js');

Page({
  data: {
    isEdit: false,
    editId: '',
    name: '',
    note: '',
    icon: '💰',
    color: '#4A90D9',
    iconChoices: bookUtil.BOOK_ICONS,
    colorChoices: bookUtil.BOOK_COLORS
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑账本' });
      this.loadBook(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新建账本' });
    }
  },

  async loadBook(id) {
    const books = await bookUtil.getAllBooks();
    const book = books.find(b => b._id === id);
    if (book) {
      this.setData({
        name: book.name || '',
        note: book.note || '',
        icon: book.icon || '💰',
        color: book.color || '#4A90D9'
      });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  selectIcon(e) {
    this.setData({ icon: e.currentTarget.dataset.icon });
  },

  selectColor(e) {
    this.setData({ color: e.currentTarget.dataset.value });
  },

  async save() {
    const { name, icon, color, note, isEdit, editId } = this.data;
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入账本名称', icon: 'none' });
      return;
    }

    const data = {
      name: name.trim(),
      icon,
      color,
      note: note || ''
    };

    try {
      if (isEdit) {
        await bookUtil.updateBook(editId, data);
      } else {
        const book = await bookUtil.createBook(data);
        await bookUtil.switchBook(book._id);
      }
      bookUtil.invalidate();
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  }
});