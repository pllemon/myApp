const bookUtil = require('../../../utils/book.js');
const db = require('../../../utils/db.js');

Page({
  data: {
    books: [],
    currentId: '',
    loading: true
  },

  onShow() {
    this.loadBooks();
  },

  async loadBooks() {
    this.setData({ loading: true });
    try {
      const books = await bookUtil.getAllBooks();
      const currentId = bookUtil.getCurrentBookId();
      this.setData({ books, currentId, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async switchBook(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.currentId) return;
    await bookUtil.switchBook(id);
    this.setData({ currentId: id });
    wx.showToast({ title: '已切换', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/accounting/books/edit' });
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/accounting/books/edit?id=' + id });
  },

  async deleteBook(e) {
    const id = e.currentTarget.dataset.id;
    const book = this.data.books.find(b => b._id === id);
    if (!book) return;

    if (this.data.books.length <= 1) {
      wx.showToast({ title: '至少保留一个账本', icon: 'none' });
      return;
    }

    const res = await wx.showModal({
      title: '删除账本',
      content: `账本「${book.name}」及其所有记账记录将被永久删除，确定吗？`,
      confirmColor: '#E74C3C'
    });
    if (!res.confirm) return;

    try {
      await bookUtil.deleteBook(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadBooks();
    } catch (e) {
      wx.showToast({ title: e.message || '删除失败', icon: 'none' });
    }
  }
});