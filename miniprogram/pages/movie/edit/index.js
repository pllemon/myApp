const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
const dateUtil = require('../../../utils/date.js');
const util = require('../../../utils/movie.js');
const theme = require('../../../utils/theme.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    director: '',
    actors: '',
    category: 'drama',
    categoryOptions: [],
    status: 'plan',
    statusOptions: [],
    releaseYear: '',
    watchedDate: '',
    duration: '',
    rating: 0,
    note: '',
    images: [],
    today: '',
    stars: [1, 2, 3, 4, 5]
  },

  onLoad(options) {
    theme.applyToPage(this);
    const today = dateUtil.today();
    this.setData({
      today,
      categoryOptions: util.CATEGORY_LIST.map(key => ({
        key,
        label: util.CATEGORIES[key].label,
        color: util.CATEGORIES[key].color,
        soft: util.hexToRgba(util.CATEGORIES[key].color, 0.1)
      })),
      statusOptions: util.STATUS_LIST.map(key => ({
        key,
        label: util.STATUS[key].label,
        color: util.STATUS[key].color,
        soft: util.hexToRgba(util.STATUS[key].color, 0.1)
      }))
    });
    if (options && options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.load(options.id);
    }
  },

  async load(id) {
    try {
      const it = await db.getById(db.COLLECTIONS.MOVIE, id);
      if (it) {
        this.setData({
          title: it.title || '',
          director: it.director || '',
          actors: it.actors || '',
          category: it.category || 'drama',
          status: it.status || 'plan',
          releaseYear: it.releaseYear != null ? String(it.releaseYear) : '',
          watchedDate: it.watchedDate || '',
          duration: it.duration != null ? String(it.duration) : '',
          rating: Number(it.rating) || 0,
          note: it.note || '',
          images: it.images || []
        });
      }
    } catch (e) {
      console.error('movie load error:', e);
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onDirectorInput(e) { this.setData({ director: e.detail.value }); },
  onActorsInput(e) { this.setData({ actors: e.detail.value }); },
  onYearInput(e) { this.setData({ releaseYear: e.detail.value }); },
  onDurationInput(e) { this.setData({ duration: e.detail.value }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  selectCategory(e) { this.setData({ category: e.currentTarget.dataset.key }); },
  selectStatus(e) { this.setData({ status: e.currentTarget.dataset.key }); },

  onDateChange(e) { this.setData({ watchedDate: e.detail.value }); },
  clearDate() { this.setData({ watchedDate: '' }); },

  selectRating(e) {
    const r = Number(e.currentTarget.dataset.r);
    const cur = this.data.rating === r ? 0 : r;
    this.setData({ rating: cur });
  },

  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  async save() {
    const title = (this.data.title || '').trim();
    if (!title) {
      ui.toast('请输入影片名称', 'none');
      return;
    }
    const record = {
      title,
      director: (this.data.director || '').trim(),
      actors: (this.data.actors || '').trim(),
      category: this.data.category,
      status: this.data.status,
      releaseYear: util.formatYear(this.data.releaseYear),
      watchedDate: this.data.watchedDate || null,
      duration: Number(this.data.duration) || 0,
      rating: Number(this.data.rating) || 0,
      note: (this.data.note || '').trim(),
      images: this.data.images
    };
    if (!record.watchedDate && record.status === 'watched') {
      record.watchedDate = this.data.today;
    }
    try {
      if (this.data.isEdit) {
        const old = await db.getById(db.COLLECTIONS.MOVIE, this.data.id);
        if (old) imageUtil.cleanOldImages(old.images || [], record.images);
        await db.update(db.COLLECTIONS.MOVIE, this.data.id, record);
      } else {
        await db.add(db.COLLECTIONS.MOVIE, record);
      }
      ui.toast('已保存');
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error('movie save error:', e);
      ui.toast('保存失败', 'none');
    }
  },

  remove() {
    if (!this.data.isEdit) return;
    ui.confirmDeleteWith({ title: "确认删除", content: "删除后不可恢复" }, async (res) => {
        if (!res.confirm) return;
        try {
          const old = await db.getById(db.COLLECTIONS.MOVIE, this.data.id);
          if (old) imageUtil.cleanAllImages(old.images);
          await db.remove(db.COLLECTIONS.MOVIE, this.data.id);
          ui.toast('已删除');
          setTimeout(() => wx.navigateBack(), 500);
        } catch (e) {
          console.error('movie remove error:', e);
        }
      }
    );
  }
});