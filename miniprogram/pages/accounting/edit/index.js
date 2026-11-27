const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
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

  onShow() {
    // 从分类管理页返回时重新读取类目；仍有效的选择保留，类目被删则清空
    if (!this._bookId) return;
    const parents = categoryUtil.getCategoriesByType(this.data.type, this._bookId);
    const hasCurrent = parents.some(p => p._id === this.data.currentParentId);
    const currentParentId = hasCurrent ? this.data.currentParentId : (parents[0] ? parents[0]._id : '');
    const currentParent = parents.find(p => p._id === currentParentId) || null;
    const childStillExists = currentParent && this.data.selectedChild &&
      currentParent.children.some(c => c._id === this.data.selectedChild);
    const selectedChild = childStillExists ? this.data.selectedChild : null;
    let selectedParent = null;
    if (this.data.selectedParent) {
      selectedParent = parents.find(p => p._id === this.data.selectedParent._id) || currentParent;
    }
    this.setData({
      parents,
      currentParentId,
      currentChildren: currentParent ? currentParent.children : [],
      selectedChild,
      selectedParent
    });
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

  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  async save() {
    const { amount, selectedChild, selectedParent, type, dateStr, note, isEdit, editId, images } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      ui.toast('请输入金额', 'none');
      return;
    }
    if (!selectedChild || !selectedParent) {
      ui.toast('请选择分类', 'none');
      return;
    }

    const child = selectedParent.children.find(c => c._id === selectedChild);
    if (!child) {
      ui.toast('分类数据异常', 'none');
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
      bizDate: dateStr,
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
      ui.toast('已更新');
    } else {
      await db.add(db.COLLECTIONS.ACCOUNTING, record);
      statsCache.addRecord(record);
      ui.toast('已保存');
    }

    setTimeout(() => wx.navigateBack(), 500);
  },

  async deleteRecord() {
    if (!this.data.isEdit) return;
    const res = await ui.confirmDeleteLegacy()
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
      ui.toast('已删除');
      setTimeout(() => wx.navigateBack(), 500);
    }
  }
});