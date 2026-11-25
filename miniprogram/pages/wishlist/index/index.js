const util = require('../../../utils/wishlist.js');
const dateUtil = require('../../../utils/date.js');
const theme = require('../../../utils/theme.js');

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'done', label: '已实现' }
];

Page({
  data: {
    filters: FILTERS,
    activeFilter: 'all',
    list: [],
    summary: { total: 0, achieved: 0, active: 0, rate: 0 },
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
      const all = await util.loadWishlist();
      const today = dateUtil.today();
      const decorated = all.map(i => {
        const d = util.decorate(i);
        let dueLabel = '';
        let overdue = false;
        if (i.targetDate && !i.achieved) {
          const diff = Math.round((new Date(i.targetDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
          if (diff < 0) { dueLabel = '已逾期'; overdue = true; }
          else if (diff === 0) dueLabel = '今天截止';
          else dueLabel = '剩 ' + diff + ' 天';
        }
        return Object.assign({}, d, { dueLabel, overdue });
      });

      let filtered = decorated;
      if (this.data.activeFilter === 'active') {
        filtered = decorated.filter(i => !i.achieved);
      } else if (this.data.activeFilter === 'done') {
        filtered = decorated.filter(i => i.achieved);
      }

      const achieved = all.filter(i => i.achieved).length;
      const total = all.length;
      this.setData({
        list: filtered,
        showEmpty: filtered.length === 0,
        summary: {
          total,
          achieved,
          active: total - achieved,
          rate: total > 0 ? Math.round(achieved / total * 100) : 0
        }
      });
    } catch (e) {
      console.error('wishlist loadList error:', e);
    }
  },

  switchFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key });
    this.loadList();
  },

  async toggleAchieved(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find(t => t._id === id);
    if (!item) return;
    try {
      await util.toggleAchieved(item);
      this.loadList();
    } catch (err) {
      console.error('toggleAchieved error:', err);
    }
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/wishlist/edit/index?id=' + (id || '') });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/wishlist/edit/index' });
  }
});