const util = require('../../../utils/anniversary.js');
const dateUtil = require('../../../utils/date.js');
const theme = require('../../../utils/theme.js');

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'upcoming', label: '30天内' },
  { key: 'past', label: '已过' }
];

Page({
  data: {
    filters: FILTERS,
    activeFilter: 'all',
    list: [],
    nearest: null,
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
      const all = await util.loadAnniversaries();
      const today = dateUtil.today();
      const decorated = all.map(i => util.decorate(i, today));

      decorated.sort((a, b) => {
        const aUp = a.daysUntil >= 0;
        const bUp = b.daysUntil >= 0;
        if (aUp !== bUp) return aUp ? -1 : 1;
        if (aUp) return a.daysUntil - b.daysUntil;
        return b.daysUntil - a.daysUntil;
      });

      let filtered = decorated;
      if (this.data.activeFilter === 'upcoming') {
        filtered = decorated.filter(i => i.daysUntil >= 0 && i.daysUntil <= 30);
      } else if (this.data.activeFilter === 'past') {
        filtered = decorated.filter(i => i.daysUntil < 0);
      }

      const upcoming = decorated.filter(i => i.daysUntil >= 0);
      const nearest = upcoming.length
        ? upcoming.slice().sort((a, b) => a.daysUntil - b.daysUntil)[0]
        : (decorated[0] || null);

      this.setData({
        list: filtered,
        nearest,
        showEmpty: filtered.length === 0
      });
    } catch (e) {
      console.error('anniversary loadList error:', e);
    }
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key });
    this.loadList();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/anniversary/detail/index?id=' + (id || '') });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/anniversary/edit/index' });
  }
});