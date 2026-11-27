const tabState = require('../../../utils/tab-state.js');
const ui = require('../../../utils/interaction.js');
const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const diaryUtil = require('../../../utils/diary.js');
const imageUtil = require('../../../utils/image.js');

Page({
  behaviors: [tabState.behavior],
  data: {
    groups: [],
    totalCount: 0,
    wordCount: 0,
    moodStats: {},
    showSearch: false,
    keyword: '',
    loading: false,
    viewMode: 'list',
    calMonth: '',
    calLabel: '',
    calDays: [],
    selectedDate: '',
    selectedDiaries: [],
    weekdays: ['一', '二', '三', '四', '五', '六', '日']
  },

  onLoad() {
    const m = dateUtil.currentMonth();
    this.setData({
      calMonth: `${m.year}-${String(m.month).padStart(2, '0')}`,
      calLabel: `${m.year}年${m.month}月`
    });
  },

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
      this._allDiaries = all;
      this.buildCalendar();

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
        this.decorateWeather(d);
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
      ui.toast('加载失败', 'none');
    }
    this.setData({ loading: false });
  },

  toggleView() {
    this.setData({ viewMode: this.data.viewMode === 'list' ? 'calendar' : 'list' });
  },

  // 历史天气可能是中文 label，统一补出图标名 + 中文两个回显字段
  decorateWeather(d) {
    const weather = diaryUtil.WEATHER_VALUE_OF[d.weather] || d.weather || '';
    d._weatherIcon = weather;
    d._weatherLabel = weather ? (diaryUtil.WEATHER_LABELS[weather] || weather) : '';
    return d;
  },

  buildCalendar() {
    const [y, m] = this.data.calMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < offset; i++) days.push({ empty: true, key: 'e' + i });
    const diaries = this._allDiaries || [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = diaries.filter(x => dateUtil.bizDateOf(x) === key);
      days.push({
        key,
        day: d,
        count: items.length,
        mood: items.length ? (items[0].mood || '') : ''
      });
    }
    this.setData({ calDays: days });
  },

  shiftCalMonth(delta) {
    const [y, m] = this.data.calMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.setData({
      calMonth: month,
      calLabel: `${d.getFullYear()}年${d.getMonth() + 1}月`,
      selectedDate: '',
      selectedDiaries: []
    }, () => this.buildCalendar());
  },

  calPrev() { this.shiftCalMonth(-1); },
  calNext() { this.shiftCalMonth(1); },

  selectDay(e) {
    const { key, day, count } = e.currentTarget.dataset;
    if (!day) return;
    if (!count) {
      wx.navigateTo({ url: `/pages/diary/editor/index?date=${key}` });
      return;
    }
    const items = (this._allDiaries || [])
      .filter(x => dateUtil.bizDateOf(x) === key)
      .map(x => this.decorateWeather({ ...x, _summary: diaryUtil.getSummary(x.content, 60) }));
    this.setData({ selectedDate: key, selectedDiaries: items });
  },

  goYearbook() {
    wx.navigateTo({ url: '/pages/diary/yearbook/index' });
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

  async onDiaryLongPress(e) {
    const action = await ui.showItemActions();
    if (action === 'edit') this.goEdit(e);
    if (action === 'delete') await this.deleteDiary(e);
  },

  async deleteDiary(e) {
    const { id } = e.currentTarget.dataset;
    const res = await ui.confirmDeleteLegacy()
    if (!res.confirm) return;

    const diary = await db.getById(db.COLLECTIONS.DIARY, id);
    if (diary && diary.images) imageUtil.cleanAllImages(diary.images);
    await db.remove(db.COLLECTIONS.DIARY, id);
    ui.toast('已删除');
    this.loadDiaries();
  }
});