const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const diaryUtil = require('../../../utils/diary.js');

Page({
  data: {
    year: 0,
    total: 0,
    wordCount: 0,
    activeDays: 0,
    maxStreak: 0,
    monthly: [],
    moods: [],
    topTags: [],
    highlights: [],
    loading: true
  },

  onLoad() {
    this.setData({ year: new Date().getFullYear() });
    wx.setNavigationBarTitle({ title: '年度回忆' });
  },

  onShow() {
    this.build();
  },

  shiftYear(delta) {
    this.setData({ year: this.data.year + delta, loading: true }, () => this.build());
  },

  prevYear() { this.shiftYear(-1); },
  nextYear() { this.shiftYear(1); },

  async build() {
    try {
      const all = await db.list(db.COLLECTIONS.DIARY);
      const year = String(this.data.year);
      const list = all.filter(d => {
        const day = dateUtil.bizDateOf(d);
        return day && day.slice(0, 4) === year;
      }).sort((a, b) => {
        const da = dateUtil.bizDateOf(a), db2 = dateUtil.bizDateOf(b);
        return da < db2 ? -1 : da > db2 ? 1 : 0;
      });

      const dates = list.map(d => dateUtil.bizDateOf(d));
      const uniqueDates = [...new Set(dates)].sort();
      const maxStreak = this.calcMaxStreak(uniqueDates);

      const monthly = [];
      for (let m = 1; m <= 12; m++) {
        const count = dates.filter(d => Number(d.slice(5, 7)) === m).length;
        monthly.push({ month: m, label: m + '月', count });
      }
      const maxCount = Math.max(1, ...monthly.map(m => m.count));
      monthly.forEach(m => { m.height = Math.max(6, Math.round(m.count / maxCount * 100)); });

      const moodMap = {};
      const tagMap = {};
      let wordCount = 0;
      list.forEach(d => {
        wordCount += (d.content || '').length;
        if (d.mood) {
          // 历史数据可能是中文 label，先转成图标名再统计
          const mood = diaryUtil.MOOD_VALUE_OF[d.mood] || d.mood;
          moodMap[mood] = (moodMap[mood] || 0) + 1;
        }
        (d.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
      });
      const moods = Object.entries(moodMap)
        .map(([emoji, count]) => ({ emoji, label: diaryUtil.MOOD_LABELS[emoji] || emoji, count }))
        .sort((a, b) => b.count - a.count);
      const topTags = Object.entries(tagMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const byMonth = {};
      list.forEach(d => {
        const m = Number(dateUtil.bizDateOf(d).slice(5, 7));
        if (!byMonth[m] || (d.content || '').length > (byMonth[m].content || '').length) {
          byMonth[m] = { ...d, _summary: diaryUtil.getSummary(d.content, 60) };
        }
      });
      const highlights = Object.keys(byMonth)
        .map(Number).sort((a, b) => a - b)
        .map(m => ({ month: m, ...byMonth[m] }));

      this.setData({
        total: list.length,
        wordCount,
        activeDays: uniqueDates.length,
        maxStreak,
        monthly,
        moods,
        topTags,
        highlights,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  calcMaxStreak(sortedDates) {
    if (!sortedDates.length) return 0;
    let max = 1, cur = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const now = new Date(sortedDates[i] + 'T00:00:00');
      const diff = Math.round((now - prev) / 86400000);
      if (diff === 1) cur++;
      else if (diff > 1) cur = 1;
      if (cur > max) max = cur;
    }
    return max;
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/diary/detail/index?id=${id}` });
  }
});
