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
    selected: -1,
    visible: false
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
        if (item.pagePath === route) selected = i;
        return item;
      });
      this.setData({
        list,
        selected,
        visible: selected >= 0,
        color: config.color,
        selectedColor: config.selectedColor,
        bgColor: config.bgColor,
        borderColor: config.borderColor
      });
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