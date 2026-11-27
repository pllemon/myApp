const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
const dateUtil = require('../../../utils/date.js');
const util = require('../../../utils/reading.js');
const theme = require('../../../utils/theme.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    author: '',
    publisher: '',
    category: 'literature',
    categoryOptions: [],
    status: 'plan',
    statusOptions: [],
    startDate: '',
    finishDate: '',
    totalPages: '',
    currentPage: '',
    progress: 0,
    rating: 0,
    note: '',
    images: [],
    today: '',
    stars: [1, 2, 3, 4, 5],
    showProgressSlider: false
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
      const it = await db.getById(db.COLLECTIONS.READING, id);
      if (it) {
        const status = it.status || 'plan';
        this.setData({
          title: it.title || '',
          author: it.author || '',
          publisher: it.publisher || '',
          category: it.category || 'literature',
          status,
          startDate: it.startDate || '',
          finishDate: it.finishDate || '',
          totalPages: it.totalPages != null ? String(it.totalPages) : '',
          currentPage: it.currentPage != null ? String(it.currentPage) : '',
          progress: Number(it.progress) || 0,
          rating: Number(it.rating) || 0,
          note: it.note || '',
          images: it.images || [],
          showProgressSlider: status === 'reading'
        });
      }
    } catch (e) {
      console.error('reading load error:', e);
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onAuthorInput(e) { this.setData({ author: e.detail.value }); },
  onPublisherInput(e) { this.setData({ publisher: e.detail.value }); },
  onTotalPagesInput(e) { this.setData({ totalPages: e.detail.value }); },
  onCurrentPageInput(e) { this.setData({ currentPage: e.detail.value }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  selectCategory(e) { this.setData({ category: e.currentTarget.dataset.key }); },
  selectStatus(e) {
    const status = e.currentTarget.dataset.key;
    const patch = { status, showProgressSlider: status === 'reading' };
    if (status === 'reading' && !this.data.startDate) {
      patch.startDate = this.data.today;
    }
    this.setData(patch);
  },

  onStartDateChange(e) { this.setData({ startDate: e.detail.value }); },
  onFinishDateChange(e) { this.setData({ finishDate: e.detail.value }); },
  clearStartDate() { this.setData({ startDate: '' }); },
  clearFinishDate() { this.setData({ finishDate: '' }); },

  onProgressChange(e) {
    const v = Number(e.detail.value) || 0;
    this.setData({ progress: v });
  },

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
      ui.toast('请输入书名', 'none');
      return;
    }
    let progress = Number(this.data.progress) || 0;
    if (this.data.status === 'finished') progress = 100;

    const currentPage = Number(this.data.currentPage) || 0;
    const totalPages = Number(this.data.totalPages) || 0;
    if (this.data.status !== 'finished' && this.data.status !== 'plan' && totalPages > 0 && currentPage > 0) {
      progress = Math.max(progress, Math.min(99, Math.round(currentPage / totalPages * 100)));
    }

    const record = {
      title,
      author: (this.data.author || '').trim(),
      publisher: (this.data.publisher || '').trim(),
      category: this.data.category,
      status: this.data.status,
      startDate: this.data.startDate || null,
      finishDate: this.data.status === 'finished' ? (this.data.finishDate || this.data.today) : (this.data.finishDate || null),
      totalPages: totalPages,
      currentPage: currentPage,
      progress,
      rating: this.data.status === 'finished' ? (Number(this.data.rating) || 0) : 0,
      note: (this.data.note || '').trim(),
      images: this.data.images
    };
    if (!record.startDate && (this.data.status === 'reading' || this.data.status === 'finished')) {
      record.startDate = this.data.today;
    }
    try {
      if (this.data.isEdit) {
        const old = await db.getById(db.COLLECTIONS.READING, this.data.id);
        if (old) imageUtil.cleanOldImages(old.images || [], record.images);
        await db.update(db.COLLECTIONS.READING, this.data.id, record);
      } else {
        await db.add(db.COLLECTIONS.READING, record);
      }
      ui.toast('已保存');
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error('reading save error:', e);
      ui.toast('保存失败', 'none');
    }
  },

  remove() {
    if (!this.data.isEdit) return;
    ui.confirmDeleteWith({ title: "确认删除", content: "删除后不可恢复" }, async (res) => {
        if (!res.confirm) return;
        try {
          const old = await db.getById(db.COLLECTIONS.READING, this.data.id);
          if (old) imageUtil.cleanAllImages(old.images);
          await db.remove(db.COLLECTIONS.READING, this.data.id);
          ui.toast('已删除');
          setTimeout(() => wx.navigateBack(), 500);
        } catch (e) {
          console.error('reading remove error:', e);
        }
      }
    );
  }
});