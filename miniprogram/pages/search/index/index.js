const timelineUtil = require('../../../utils/timeline.js');
const theme = require('../../../utils/theme.js');

Page({
  data: {
    keyword: '',
    results: [],
    resultGroups: [],
    showEmpty: false,
    searched: false,
    suggestions: ['工资', '咖啡', '朋友', '读书', '跑步', '生日']
  },

  observers: {
    'results': function (results) {
      this.setData({ resultGroups: this.groupResults(results) });
    }
  },

  onLoad() {
    theme.applyToPage(this);
  },

  onShow() {
    theme.applyToPage(this);
  },

  onInput(e) {
    const kw = e.detail.value;
    this.setData({ keyword: kw });
    if (kw.trim()) this.doSearch();
    else this.setData({ results: [], searched: false, showEmpty: false });
  },

  async doSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) {
      this.setData({ results: [], searched: false, showEmpty: false });
      return;
    }
    try {
      const results = await timelineUtil.searchAll(kw);
      this.setData({
        results,
        searched: true,
        showEmpty: results.length === 0
      });
    } catch (e) {
      console.error('search error:', e);
    }
  },

  useSuggestion(e) {
    const kw = e.currentTarget.dataset.kw;
    this.setData({ keyword: kw });
    this.doSearch();
  },

  clearKeyword() {
    this.setData({ keyword: '', results: [], searched: false, showEmpty: false });
  },

  goItem(e) {
    const path = e.currentTarget.dataset.path;
    if (path) wx.navigateTo({ url: path });
  },

  groupResults(results) {
    const groups = [];
    const indexByModule = {};
    (results || []).forEach(item => {
      const key = item.module || '';
      if (!Object.prototype.hasOwnProperty.call(indexByModule, key)) {
        indexByModule[key] = groups.length;
        groups.push({ module: key, label: item.moduleLabel || '', items: [] });
      }
      groups[indexByModule[key]].items.push(item);
    });
    return groups;
  }
});