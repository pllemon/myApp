const tabConfig = require('../../utils/tabbar-config.js');

function currentRoute() {
  const pages = getCurrentPages();
  if (!pages || pages.length === 0) return '';
  const route = pages[pages.length - 1].route || '';
  return route.startsWith('/') ? route : '/' + route;
}

Component({
  data: {
    list: [],
    selected: -1
  },

  lifetimes: {
    attached() {
      this.refreshConfig();
    }
  },

  pageLifetimes: {
    show() {
      this.refreshConfig();
    }
  },

  methods: {
    refreshConfig() {
      const config = tabConfig.loadConfig();
      const route = currentRoute();
      let selected = -1;
      const list = config.list.map((item, i) => {
        const active = item.pagePath === route;
        if (active) selected = i;
        return {
          ...item,
          showBadge: item.showBadge && item.badgeCount > 0,
          showDot: item.showDot,
          selected: active
        };
      });
      this.setData({
        list,
        selected,
        color: config.color,
        selectedColor: config.selectedColor,
        bgColor: config.bgColor,
        borderColor: config.borderColor
      });
    },

    setSelected(index) {
      const list = this.data.list.map((item, i) => ({
        ...item,
        selected: i === index
      }));
      this.setData({ list, selected: index });
    },

    showBadge(pagePath, count) {
      const list = this.data.list.map(item => {
        if (item.pagePath === pagePath) {
          return { ...item, showBadge: true, badgeCount: count, showDot: false };
        }
        return item;
      });
      this.setData({ list });
    },

    showDot(pagePath) {
      const list = this.data.list.map(item => {
        if (item.pagePath === pagePath) {
          return { ...item, showDot: true, showBadge: false };
        }
        return item;
      });
      this.setData({ list });
    },

    hideBadge(pagePath) {
      const list = this.data.list.map(item => {
        if (item.pagePath === pagePath) {
          return { ...item, showBadge: false, showDot: false, badgeCount: 0 };
        }
        return item;
      });
      this.setData({ list });
    },

    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (!path) return;
      if (path === currentRoute()) return;
      this.setData({ selected: index });
      wx.reLaunch({ url: path });
    }
  }
});