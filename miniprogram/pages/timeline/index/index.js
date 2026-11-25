const timelineUtil = require('../../../utils/timeline.js');
const theme = require('../../../utils/theme.js');

Page({
  data: {
    groups: [],
    showEmpty: false,
    filters: [
      { key: 'all', label: '全部', active: true },
      { key: 'life', label: '生活', active: false },
      { key: 'money', label: '金钱', active: false },
      { key: 'culture', label: '文化', active: false }
    ]
  },

  onLoad() {
    theme.applyToPage(this);
    this.load();
  },

  onShow() {
    theme.applyToPage(this);
    this.load();
  },

  async load() {
    try {
      const active = this.data.filters.find(f => f.active);
      let modules = null;
      if (active.key === 'life') modules = ['diary', 'checkin', 'todo', 'anniversary', 'wishlist'];
      else if (active.key === 'money') modules = ['accounting'];
      else if (active.key === 'culture') modules = ['movie', 'reading'];

      const groups = await timelineUtil.loadTimeline(modules);
      this.setData({
        groups,
        showEmpty: groups.length === 0
      });
    } catch (e) {
      console.error('timeline load error:', e);
    }
  },

  switchFilter(e) {
    const key = e.currentTarget.dataset.key;
    const filters = this.data.filters.map(f => ({
      key: f.key,
      label: f.label,
      active: f.key === key
    }));
    this.setData({ filters });
    this.load();
  },

  goItem(e) {
    const path = e.currentTarget.dataset.path;
    if (path) wx.navigateTo({ url: path });
  }
});