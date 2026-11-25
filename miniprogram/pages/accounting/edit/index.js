const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const categoryUtil = require('../../../utils/category.js');
const statsCache = require('../../../utils/stats-cache.js');
const bookUtil = require('../../../utils/book.js');

const MAX_IMAGES = 3;

Page({
  data: {
    isEdit: false,
    editId: null,
    type: 'expense',
    amount: '',
    note: '',
    dateStr: '',
    parents: [],
    currentParentId: '',
    currentChildren: [],
    selectedChild: null,
    selectedParent: null,
    images: []
  },

  onLoad(options) {
    this._bookId = options.bookId || bookUtil.getCurrentBookId();
    const parents = categoryUtil.getCategoriesByType('expense', this._bookId);
    const currentParentId = parents[0] ? parents[0]._id : '';
    const currentParent = parents.find(p => p._id === currentParentId) || null;

    this.setData({
      dateStr: dateUtil.today(),
      parents,
      currentParentId,
      currentChildren: currentParent ? currentParent.children : []
    });

    if (options.id) {
      this.loadRecord(options.id);
    }
  },

  async loadRecord(id) {
    const record = await db.getById(db.COLLECTIONS.ACCOUNTING, id);
    if (record) {
      this._bookId = record.bookId || this._bookId || bookUtil.getCurrentBookId();
      const parents = categoryUtil.getCategoriesByType(record.type, this._bookId);
      let currentParentId = record.parentCategoryId;
      let currentParent = parents.find(p => p._id === currentParentId);
      if (!currentParent) {
        currentParent = parents[0];
        currentParentId = currentParent ? currentParent._id : '';
      }

      this.setData({
        isEdit: true,
        editId: id,
        type: record.type,
        amount: String(record.amount),
        note: record.note || '',
        dateStr: dateUtil.formatDate(record.createdAt, 'YYYY-MM-DD'),
        parents: categoryUtil.getCategoriesByType(record.type, this._bookId),
        currentParentId,
        currentChildren: currentParent ? currentParent.children : [],
        selectedChild: record.categoryId || record.category,
        selectedParent: currentParent,
        images: record.images || []
      });
      wx.setNavigationBarTitle({ title: '编辑记录' });
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    const parents = categoryUtil.getCategoriesByType(type, this._bookId);
    const currentParent = parents[0] || null;
    this.setData({
      type,
      parents,
      currentParentId: currentParent ? currentParent._id : '',
      currentChildren: currentParent ? currentParent.children : [],
      selectedChild: null,
      selectedParent: null
    });
  },

  selectParent(e) {
    const id = e.currentTarget.dataset.id;
    const parent = this.data.parents.find(p => p._id === id);
    this.setData({
      currentParentId: id,
      currentChildren: parent ? parent.children : [],
      selectedChild: null,
      selectedParent: parent
    });
  },

  selectChild(e) {
    const { id, parentid } = e.currentTarget.dataset;
    const parent = this.data.parents.find(p => p._id === parentid);
    this.setData({
      selectedChild: id,
      selectedParent: parent
    });
  },

  onAmountInput(e) {
    let v = e.detail.value;
    if (v && v.indexOf('.') !== -1) {
      const parts = v.split('.');
      if (parts[1].length > 2) {
        v = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }
    this.setData({ amount: v });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ dateStr: e.detail.value });
  },

  goManageCategory() {
    wx.navigateTo({ url: '/pages/accounting/category/index' });
  },

  async chooseImage() {
    const remain = MAX_IMAGES - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传' + MAX_IMAGES + '张', icon: 'none' });
      return;
    }
    try {
      const res = await wx.chooseMedia({
        count: remain,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });
      const savedPaths = [];
      for (const item of res.tempFiles) {
        try {
          const saved = await wx.saveFile({ tempFilePath: item.tempFilePath });
          savedPaths.push(saved.savedFilePath);
        } catch (e) {
          savedPaths.push(item.tempFilePath);
        }
      }
      this.setData({
        images: [...this.data.images, ...savedPaths]
      });
    } catch (e) {}
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  async save() {
    const { amount, selectedChild, selectedParent, type, dateStr, note, isEdit, editId, images } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    if (!selectedChild || !selectedParent) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    const child = selectedParent.children.find(c => c._id === selectedChild);
    if (!child) {
      wx.showToast({ title: '分类数据异常', icon: 'none' });
      return;
    }

    const createdAt = new Date(dateStr + 'T' + dateUtil.formatDate(Date.now(), 'HH:mm:ss')).getTime();
    const record = {
      type,
      amount: parseFloat(amount),
      categoryId: child._id,
      category: child.name,
      categoryIcon: child.icon,
      parentCategoryId: selectedParent._id,
      parentCategory: selectedParent.name,
      parentCategoryIcon: selectedParent.icon,
      note: note || '',
      images,
      createdAt,
      bookId: this._bookId || bookUtil.getCurrentBookId()
    };

    if (isEdit) {
      const oldRecord = await db.getById(db.COLLECTIONS.ACCOUNTING, editId);
      if (oldRecord && oldRecord.images) {
        const removed = oldRecord.images.filter(p => !images.includes(p));
        removed.forEach(p => {
          if (p.indexOf('wxfile://') === 0) {
            wx.removeSavedFile({ filePath: p }).catch(() => {});
          }
        });
      }
      await db.update(db.COLLECTIONS.ACCOUNTING, editId, record);
      statsCache.updateRecord(oldRecord, record);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      await db.add(db.COLLECTIONS.ACCOUNTING, record);
      statsCache.addRecord(record);
      wx.showToast({ title: '已保存', icon: 'success' });
    }

    setTimeout(() => wx.navigateBack(), 500);
  },

  async deleteRecord() {
    if (!this.data.isEdit) return;
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmColor: '#E74C3C'
    });
    if (res.confirm) {
      const oldRecord = await db.getById(db.COLLECTIONS.ACCOUNTING, this.data.editId);
      if (oldRecord && oldRecord.images) {
        oldRecord.images.forEach(p => {
          if (p.indexOf('wxfile://') === 0) {
            wx.removeSavedFile({ filePath: p }).catch(() => {});
          }
        });
      }
      await db.remove(db.COLLECTIONS.ACCOUNTING, this.data.editId);
      statsCache.removeRecord(oldRecord);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    }
  }
});