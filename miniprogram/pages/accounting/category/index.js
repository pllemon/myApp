const categoryUtil = require('../../../utils/category.js');
const bookUtil = require('../../../utils/book.js');

const ICON_CHOICES = ['🍜','🍎','🥤','🍽️','🥡','🚌','🚇','🚕','✈️','⛽','🛒','👕','📱','🧴','🎮','🎬','⚽','🏖️','🏠','💡','📶','🔧','💊','🏥','📋','📚','🎓','✏️','📌','💰','🎁','📈','💵','💳','🧧','🏘️','💼','💻','🏢'];

Page({
  data: {
    type: 'expense',
    parents: [],
    ICON_CHOICES,
    editingParent: null,
    editingChild: null,
    showIconPicker: false,
    pickerFor: null,
    currentIcons: []
  },

  onLoad() {
    this._bookId = bookUtil.getCurrentBookId();
    this.loadData();
  },

  loadData() {
    const parents = categoryUtil.getCategoriesByType(this.data.type, this._bookId);
    this.setData({ parents });
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
    this.loadData();
  },

  addParent() {
    wx.showModal({
      title: '新建一级类目',
      editable: true,
      placeholderText: '类目名称（如：宠物）',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const name = res.content.trim();
          categoryUtil.addParent(this.data.type, name, '📁', this._bookId);
          this.loadData();
          wx.showToast({ title: '已添加', icon: 'success' });
        }
      }
    });
  },

  editParent(e) {
    const id = e.currentTarget.dataset.id;
    const parent = this.data.parents.find(p => p._id === id);
    if (!parent) return;
    wx.showModal({
      title: '编辑一级类目',
      editable: true,
      placeholderText: parent.name,
      content: parent.name,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          categoryUtil.updateParent(id, { name: res.content.trim() }, this._bookId);
          this.loadData();
        }
      }
    });
  },

  async deleteParent(e) {
    const id = e.currentTarget.dataset.id;
    const parent = this.data.parents.find(p => p._id === id);
    if (!parent) return;
    if (parent.isDefault) {
      wx.showToast({ title: '系统类目不可删除', icon: 'none' });
      return;
    }
    const res = await wx.showModal({
      title: '删除一级类目',
      content: `删除后，该分类下的子类目也会一起删除。确定删除「${parent.name}」吗？`,
      confirmColor: '#E74C3C'
    });
    if (res.confirm) {
      categoryUtil.removeParent(id, this._bookId);
      this.loadData();
      wx.showToast({ title: '已删除', icon: 'success' });
    }
  },

  addChild(e) {
    const parentId = e.currentTarget.dataset.parentid;
    wx.showModal({
      title: '新建子类目',
      editable: true,
      placeholderText: '子类目名称（如：外卖）',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          categoryUtil.addChild(parentId, res.content.trim(), '📌', this._bookId);
          this.loadData();
        }
      }
    });
  },

  editChild(e) {
    const { parentid, id } = e.currentTarget.dataset;
    const parent = this.data.parents.find(p => p._id === parentid);
    const child = parent.children.find(c => c._id === id);
    if (!child) return;
    wx.showModal({
      title: '编辑子类目',
      editable: true,
      content: child.name,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          categoryUtil.updateChild(parentid, id, { name: res.content.trim() }, this._bookId);
          this.loadData();
        }
      }
    });
  },

  async deleteChild(e) {
    const { parentid, id } = e.currentTarget.dataset;
    const parent = this.data.parents.find(p => p._id === parentid);
    const child = parent.children.find(c => c._id === id);
    if (!child) return;
    if (parent.children.length <= 1) {
      wx.showToast({ title: '至少保留一个子类目', icon: 'none' });
      return;
    }
    const res = await wx.showModal({
      title: '删除子类目',
      content: `确定删除「${child.name}」吗？`,
      confirmColor: '#E74C3C'
    });
    if (res.confirm) {
      categoryUtil.removeChild(parentid, id, this._bookId);
      this.loadData();
      wx.showToast({ title: '已删除', icon: 'success' });
    }
  },

  async resetAll() {
    const res = await wx.showModal({
      title: '恢复默认',
      content: '将所有类目恢复为系统默认，自定义类目会丢失。确定继续吗？',
      confirmColor: '#E74C3C'
    });
    if (res.confirm) {
      categoryUtil.resetCategories(this._bookId);
      this.loadData();
      wx.showToast({ title: '已恢复默认', icon: 'success' });
    }
  },

  pickParentIcon(e) {
    const id = e.currentTarget.dataset.id;
    const parent = this.data.parents.find(p => p._id === id);
    if (!parent) return;
    const currentIcons = this.data.ICON_CHOICES.filter(i => i !== parent.icon);
    this.setData({
      showIconPicker: true,
      pickerFor: { type: 'parent', id },
      currentIcons
    });
  },

  pickChildIcon(e) {
    const { parentid, id } = e.currentTarget.dataset;
    const parent = this.data.parents.find(p => p._id === parentid);
    const child = parent.children.find(c => c._id === id);
    if (!child) return;
    const currentIcons = this.data.ICON_CHOICES.filter(i => i !== child.icon);
    this.setData({
      showIconPicker: true,
      pickerFor: { type: 'child', parentid, id },
      currentIcons
    });
  },

  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    const { pickerFor } = this.data;
    if (pickerFor.type === 'parent') {
      categoryUtil.updateParent(pickerFor.id, { icon }, this._bookId);
    } else {
      categoryUtil.updateChild(pickerFor.parentid, pickerFor.id, { icon }, this._bookId);
    }
    this.setData({ showIconPicker: false });
    this.loadData();
  },

  closeIconPicker() {
    this.setData({ showIconPicker: false });
  }
});