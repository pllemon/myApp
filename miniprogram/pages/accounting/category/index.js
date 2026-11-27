const categoryUtil = require('../../../utils/category.js');
const ui = require('../../../utils/interaction.js');
const bookUtil = require('../../../utils/book.js');

// 新彩色分类图标（62 个中文名），按分组排列，新增/编辑分类可任选
const glyphs = require('../../../utils/icons.js');
const ICON_CHOICES = Object.keys(glyphs.FLAT);

Page({
  noop() {},
  data: {
    type: 'expense',
    parents: [],
    ICON_CHOICES,
    editingParent: null,
    editingChild: null,
    showIconPicker: false,
    pickerFor: null,
    pendingAdd: null,
    pendingEdit: null,
    currentIcons: [],
    currentIcon: ''
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

  async addParent() {
    const name = await ui.promptInput({ title: '新建一级类目', placeholder: '类目名称（如：宠物）', required: true, emptyTip: '请输入类目名称' });
    if (name === null) return;
    // 输入名称后选择图标
    this.setData({
      showIconPicker: true,
      pickerFor: { type: 'addParent' },
      pendingAdd: { type: 'parent', name },
      currentIcons: ICON_CHOICES,
      currentIcon: ''
    });
  },

  async editParent(e) {
    const id = e.currentTarget.dataset.id;
    const parent = this.data.parents.find(p => p._id === id);
    if (!parent) return;
    const name = await ui.promptInput({ title: '编辑一级类目', value: parent.name, placeholder: parent.name, required: true, emptyTip: '请输入类目名称' });
    if (name === null) return;
    // 改名后继续选图标，名称与图标一起保存
    this.setData({
      showIconPicker: true,
      pickerFor: { type: 'editParent', id },
      pendingEdit: { type: 'parent', id, name },
      currentIcons: ICON_CHOICES,
      currentIcon: parent.icon
    });
  },

  async deleteParent(e) {
    const id = e.currentTarget.dataset.id;
    const parent = this.data.parents.find(p => p._id === id);
    if (!parent) return;
    if (parent.isDefault) {
      ui.toast('系统类目不可删除', 'none');
      return;
    }
    const res = await ui.confirmDeleteLegacy({ title: '删除一级类目', content: `删除后，该分类下的子类目也会一起删除。确定删除「${parent.name}」吗？` })
    if (res.confirm) {
      categoryUtil.removeParent(id, this._bookId);
      this.loadData();
      ui.toast('已删除');
    }
  },

  async addChild(e) {
    const parentId = e.currentTarget.dataset.parentid;
    const name = await ui.promptInput({ title: '新建子类目', placeholder: '子类目名称（如：外卖）', required: true, emptyTip: '请输入子类目名称' });
    if (name === null) return;
    // 输入名称后选择图标
    this.setData({
      showIconPicker: true,
      pickerFor: { type: 'addChild' },
      pendingAdd: { type: 'child', name, parentId },
      currentIcons: ICON_CHOICES,
      currentIcon: ''
    });
  },

  async editChild(e) {
    const { parentid, id } = e.currentTarget.dataset;
    const parent = this.data.parents.find(p => p._id === parentid);
    const child = parent.children.find(c => c._id === id);
    if (!child) return;
    const name = await ui.promptInput({ title: '编辑子类目', value: child.name, required: true, emptyTip: '请输入子类目名称' });
    if (name === null) return;
    // 改名后继续选图标，名称与图标一起保存
    this.setData({
      showIconPicker: true,
      pickerFor: { type: 'editChild', parentid, id },
      pendingEdit: { type: 'child', parentid, id, name },
      currentIcons: ICON_CHOICES,
      currentIcon: child.icon
    });
  },

  async deleteChild(e) {
    const { parentid, id } = e.currentTarget.dataset;
    const parent = this.data.parents.find(p => p._id === parentid);
    const child = parent.children.find(c => c._id === id);
    if (!child) return;
    if (parent.children.length <= 1) {
      ui.toast('至少保留一个子类目', 'none');
      return;
    }
    const res = await ui.confirmDeleteLegacy()
    if (res.confirm) {
      categoryUtil.removeChild(parentid, id, this._bookId);
      this.loadData();
      ui.toast('已删除');
    }
  },

  async resetAll() {
    const res = await ui.confirmAction({ title: '恢复默认', content: '将所有类目恢复为系统默认，自定义类目会丢失。确定继续吗？' })
    if (res.confirm) {
      categoryUtil.resetCategories(this._bookId);
      this.loadData();
      ui.toast('已恢复默认');
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
      currentIcons,
      currentIcon: parent.icon
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
      currentIcons,
      currentIcon: child.icon
    });
  },

  selectIcon(e) {
    const icon = e.detail ? e.detail.icon : e.currentTarget.dataset.icon;
    const { pickerFor, pendingAdd, pendingEdit } = this.data;
    if (!pickerFor) return;

    // 新增分类：用所选图标名真正创建
    if ((pickerFor.type === 'addParent' || pickerFor.type === 'addChild') && pendingAdd) {
      if (pendingAdd.type === 'parent') {
        categoryUtil.addParent(this.data.type, pendingAdd.name, icon, this._bookId);
      } else {
        categoryUtil.addChild(pendingAdd.parentId, pendingAdd.name, icon, this._bookId);
      }
      this.setData({ showIconPicker: false, pickerFor: null, pendingAdd: null });
      this.loadData();
      ui.toast('已添加');
      return;
    }

    // 改名流程：名称 + 图标一起保存
    if ((pickerFor.type === 'editParent' || pickerFor.type === 'editChild') && pendingEdit) {
      if (pendingEdit.type === 'parent') {
        categoryUtil.updateParent(pendingEdit.id, { name: pendingEdit.name, icon }, this._bookId);
      } else {
        categoryUtil.updateChild(pendingEdit.parentid, pendingEdit.id, { name: pendingEdit.name, icon }, this._bookId);
      }
      this.setData({ showIconPicker: false, pickerFor: null, pendingEdit: null });
      this.loadData();
      ui.toast('已保存');
      return;
    }

    // 单独编辑已有分类图标
    if (pickerFor.type === 'parent') {
      categoryUtil.updateParent(pickerFor.id, { icon }, this._bookId);
    } else if (pickerFor.type === 'child') {
      categoryUtil.updateChild(pickerFor.parentid, pickerFor.id, { icon }, this._bookId);
    }
    this.setData({ showIconPicker: false, pickerFor: null });
    this.loadData();
  },

  closeIconPicker() {
    // 取消时不做任何保存：新增尚未创建，改名也不应生效
    this.setData({ showIconPicker: false, pickerFor: null, pendingAdd: null, pendingEdit: null });
  }
});