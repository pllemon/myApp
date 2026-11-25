const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const diaryUtil = require('../../../utils/diary.js');

Page({
  data: {
    groups: [],
    totalCount: 0,
    wordCount: 0,
    moodStats: {},
    showSearch: false,
    keyword: '',
    loading: false
  },

  onLoad() {},

  onShow() {
    this.loadDiaries();
  },

  onPullDownRefresh() {
    this.loadDiaries().then(() => wx.stopPullDownRefresh());
  },

  async loadDiaries() {
    this.setData({ loading: true });
    try {
      const all = await db.list(db.COLLECTIONS.DIARY, { key: 'date', order: 'desc' });
      
      let filtered = all;
      if (this.data.keyword) {
        const kw = this.data.keyword.toLowerCase();
        filtered = all.filter(d => 
          (d.title && d.title.toLowerCase().includes(kw)) ||
          (d.content && d.content.toLowerCase().includes(kw)) ||
          (d.tags && d.tags.some(t => t.toLowerCase().includes(kw)))
        );
      }

      filtered.forEach(d => {
        d._summary = diaryUtil.getSummary(d.content, 80);
        d._dateLabel = diaryUtil.formatDateLabel(d.date);
        d._tagsStr = (d.tags || []).slice(0, 5).map(t => '#' + t).join(' ');
      });

      const groups = diaryUtil.groupByDate(filtered);
      
      let wordCount = 0;
      const moodStats = {};
      all.forEach(d => {
        if (d.content) wordCount += d.content.length;
        if (d.mood) moodStats[d.mood] = (moodStats[d.mood] || 0) + 1;
      });

      this.setData({
        groups,
        totalCount: all.length,
        wordCount,
        moodStats
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  toggleSearch() {
    this.setData({ showSearch: !this.data.showSearch, keyword: '' });
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
    this.loadDiaries();
  },

  goEditor() {
    wx.navigateTo({ url: '/pages/diary/editor/index' });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/diary/detail/index?id=${id}` });
  },

  goEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/diary/editor/index?id=${id}` });
  },

  async deleteDiary(e) {
    const { id } = e.currentTarget.dataset;
    const res = await wx.showModal({
      title: '删除日记',
      content: '确定删除这篇日记吗？此操作不可恢复。',
      confirmColor: '#E74C3C'
    });
    if (!res.confirm) return;

    await db.remove(db.COLLECTIONS.DIARY, id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadDiaries();
  }
});