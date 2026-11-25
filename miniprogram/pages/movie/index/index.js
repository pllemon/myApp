const util = require('../../../utils/movie.js');
const theme = require('../../../utils/theme.js');

const FILTERS = [
  { key: 'all',      label: '全部' },
  { key: 'watched',  label: '已看过' },
  { key: 'watching', label: '观看中' },
  { key: 'plan',     label: '想看' }
];

Page({
  data: {
    filters: FILTERS,
    activeFilter: 'all',
    list: [],
    summary: { total: 0, watched: 0, watching: 0, plan: 0, avgRating: '0.0' },
    showEmpty: false
  },

  onLoad() {
    theme.applyToPage(this);
  },

  onShow() {
    theme.applyToPage(this);
    this.loadList();
  },

  async loadList() {
    try {
      const all = await util.loadMovies();
      const decorated = all.map(i => util.decorate(i));

      let filtered = decorated;
      if (this.data.activeFilter !== 'all') {
        filtered = decorated.filter(i => i.status === this.data.activeFilter);
      }

      const sorted = filtered.sort((a, b) => {
        if (this.data.activeFilter === 'all') {
          if (b.status === 'watched' && a.status !== 'watched') return -1;
          if (a.status === 'watched' && b.status !== 'watched') return 1;
        }
        const bd = new Date(b.watchedDate || b.createdAt || 0);
        const ad = new Date(a.watchedDate || a.createdAt || 0);
        return bd - ad;
      });

      this.setData({
        list: sorted,
        showEmpty: sorted.length === 0,
        summary: util.calcStats(all)
      });
    } catch (e) {
      console.error('movie loadList error:', e);
    }
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key });
    this.loadList();
  },

  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find(t => t._id === id);
    if (!item) return;
    try {
      await util.toggleStatus(item);
      this.loadList();
    } catch (err) {
      console.error('toggleStatus error:', err);
    }
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/movie/edit/index?id=' + (id || '') });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/movie/edit/index' });
  }
});