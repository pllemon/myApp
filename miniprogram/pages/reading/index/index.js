const util = require('../../../utils/reading.js');
const theme = require('../../../utils/theme.js');

const FILTERS = [
  { key: 'all',      label: '全部' },
  { key: 'finished', label: '已读完' },
  { key: 'reading',  label: '在读' },
  { key: 'plan',     label: '想读' }
];

Page({
  data: {
    filters: FILTERS,
    activeFilter: 'all',
    list: [],
    summary: { total: 0, finished: 0, reading: 0, plan: 0, avgRating: '0.0' },
    summaryItems: [
      { label: '已读完', value: 0, total: 0 },
      { label: '在读', value: 0, total: null },
      { label: '想读', value: 0, total: null },
      { label: '平均评分', value: '0.0', total: null }
    ],
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
      const all = await util.loadReadings();
      const decorated = all.map(i => util.decorate(i));

      let filtered = decorated;
      if (this.data.activeFilter !== 'all') {
        filtered = decorated.filter(i => i.status === this.data.activeFilter);
      }

      const sorted = filtered.sort((a, b) => {
        if (this.data.activeFilter === 'all') {
          if (b.status === 'reading' && a.status !== 'reading') return -1;
          if (a.status === 'reading' && b.status !== 'reading') return 1;
        }
        const bd = new Date(b.finishDate || b.startDate || b.createdAt || 0);
        const ad = new Date(a.finishDate || a.startDate || a.createdAt || 0);
        return bd - ad;
      });

      const summary = util.calcStats(all);
      this.setData({
        list: sorted,
        showEmpty: sorted.length === 0,
        summary,
        summaryItems: [
          { label: '已读完', value: summary.finished, total: summary.total },
          { label: '在读', value: summary.reading, total: null },
          { label: '想读', value: summary.plan, total: null },
          { label: '平均评分', value: summary.avgRating, total: null }
        ]
      });
    } catch (e) {
      console.error('reading loadList error:', e);
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

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/reading/detail/index?id=' + (id || '') });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/reading/edit/index' });
  }
});