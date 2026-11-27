// tab 页状态缓存：切 tab 时保留滚动位置与纯 UI 临时态。
// 用模块级内存而非 storage，避免污染备份数据；reLaunch 不会清除模块缓存。
const cache = {};

// 各 tab 页需要缓存的纯 UI 字段（持久化字段由页面自行从 storage 恢复）
const FIELDS = {
  'pages/home/index/index': ['mode', 'showAddMenu'],
  'pages/diary/index/index': ['viewMode', 'calMonth', 'selectedDate', 'keyword', 'showSearch'],
  'pages/accounting/index/index': ['typeFilter', 'showTypeFilter'],
  'pages/health/index/index': ['activeTab'],
  'pages/checkin/index/index': ['showDone'],
  'pages/todo/index/index': ['activeFilter', 'tagFilter', 'showListManager'],
  'pages/stats/index/index': [],
  'pages/profile/index/index': []
};

function normalize(route) {
  return (route || '').replace(/^\//, '');
}

function save(route, patch) {
  const key = normalize(route);
  cache[key] = Object.assign({}, cache[key] || {}, patch || {});
}

function load(route) {
  return cache[normalize(route)] || {};
}

function collect(page) {
  const route = normalize(page.route);
  const fields = FIELDS[route] || [];
  const patch = { scrollTop: page.__tabScrollTop || 0 };
  fields.forEach(k => {
    if (page.data[k] !== undefined) patch[k] = page.data[k];
  });
  return patch;
}

const behavior = Behavior({
  onPageScroll(e) {
    this.__tabScrollTop = e.scrollTop || 0;
  },

  onHide() {
    save(this.route, collect(this));
  },

  // reLaunch 切 tab 触发的是 onUnload，不是 onHide
  onUnload() {
    save(this.route, collect(this));
  },

  onShow() {
    const state = load(this.route);
    const fields = FIELDS[normalize(this.route)] || [];
    const patch = {};
    fields.forEach(k => {
      if (state[k] !== undefined && this.data[k] !== state[k]) patch[k] = state[k];
    });
    if (Object.keys(patch).length > 0) this.setData(patch);
    const top = state.scrollTop || 0;
    if (top > 0) {
      setTimeout(() => {
        wx.pageScrollTo({ scrollTop: top, duration: 0 });
      }, 50);
    }
  }
});

module.exports = { behavior, save, load };
