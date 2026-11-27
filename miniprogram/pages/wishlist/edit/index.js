const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
const util = require('../../../utils/wishlist.js');
const dateUtil = require('../../../utils/date.js');
const theme = require('../../../utils/theme.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    icon: util.ICONS[0],
    category: 'other',
    targetDate: '',
    budget: '',
    progress: 0,
    achieved: false,
    note: '',
    images: [],
    icons: util.ICONS,
    categoryOptions: util.CATEGORY_LIST.map(key => ({
      key,
      label: util.CATEGORIES[key].label,
      color: util.CATEGORIES[key].color,
      soft: util.hexToRgba(util.CATEGORIES[key].color, 0.1)
    })),
    progressDisplay: 0,
    today: ''
  },

  onLoad(options) {
    theme.applyToPage(this);
    const today = dateUtil.today();
    this.setData({ today });
    if (options && options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.load(options.id);
    }
  },

  async load(id) {
    try {
      const it = await db.getById(db.COLLECTIONS.WISHLIST, id);
      if (it) {
        const progress = util.getProgress(it);
        this.setData({
          title: it.title || '',
          icon: it.icon || util.ICONS[0],
          category: it.category || 'other',
          targetDate: it.targetDate || '',
          budget: it.budget != null ? String(it.budget) : '',
          progress,
          achieved: !!it.achieved,
          note: it.note || '',
          images: it.images || [],
          progressDisplay: progress
        });
      }
    } catch (e) {
      console.error('wishlist load error:', e);
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onBudgetInput(e) {
    this.setData({ budget: e.detail.value });
  },

  selectIcon(e) {
    const icon = e.detail ? e.detail.icon : e.currentTarget.dataset.icon;
    this.setData({ icon });
  },

  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.key });
  },

  onDateChange(e) {
    this.setData({ targetDate: e.detail.value });
  },

  clearDate() {
    this.setData({ targetDate: '' });
  },

  onProgressChange(e) {
    const v = Number(e.detail.value) || 0;
    this.setData({ progress: v, progressDisplay: v });
  },

  toggleAchieved(e) {
    const achieved = e.detail.value;
    this.setData({
      achieved,
      progressDisplay: achieved ? 100 : this.data.progress
    });
  },

  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  async save() {
    const title = (this.data.title || '').trim();
    if (!title) {
      ui.toast('请输入愿望', 'none');
      return;
    }
    const budgetNum = parseFloat(this.data.budget);
    const record = {
      title,
      icon: this.data.icon,
      category: this.data.category,
      targetDate: this.data.targetDate,
      budget: isNaN(budgetNum) ? 0 : budgetNum,
      progress: this.data.achieved ? 100 : (Number(this.data.progress) || 0),
      achieved: this.data.achieved,
      achievedAt: this.data.achieved ? Date.now() : null,
      note: (this.data.note || '').trim(),
      images: this.data.images
    };
    try {
      if (this.data.isEdit) {
        const old = await db.getById(db.COLLECTIONS.WISHLIST, this.data.id);
        if (old) imageUtil.cleanOldImages(old.images || [], record.images);
        await db.update(db.COLLECTIONS.WISHLIST, this.data.id, record);
      } else {
        await db.add(db.COLLECTIONS.WISHLIST, record);
      }
      ui.toast('已保存');
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error('wishlist save error:', e);
      ui.toast('保存失败', 'none');
    }
  },

  remove() {
    if (!this.data.isEdit) return;
    ui.confirmDeleteWith({ title: "确认删除", content: "删除后不可恢复" }, async (res) => {
        if (!res.confirm) return;
        try {
          const old = await db.getById(db.COLLECTIONS.WISHLIST, this.data.id);
          if (old) imageUtil.cleanAllImages(old.images);
          await db.remove(db.COLLECTIONS.WISHLIST, this.data.id);
          ui.toast('已删除');
          setTimeout(() => wx.navigateBack(), 500);
        } catch (e) {
          console.error('wishlist remove error:', e);
        }
      }
    );
  }
});