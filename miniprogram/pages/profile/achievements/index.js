const db = require('../../../utils/db.js');
const theme = require('../../../utils/theme.js');
const checkinUtil = require('../../../utils/checkin.js');
const bookUtil = require('../../../utils/book.js');

Page({
  data: {
    themeStyle: '',
    badges: [],
    unlockedCount: 0,
    totalCount: 0
  },

  onLoad() {
    theme.applyToPage(this);
  },

  onShow() {
    theme.applyToPage(this);
    this.loadBadges();
  },

  async loadBadges() {
    try {
      const [diaryCount, accountingCount, checkinRecords, todos] = await Promise.all([
        db.count(db.COLLECTIONS.DIARY),
        db.count(db.COLLECTIONS.ACCOUNTING, { bookId: bookUtil.getCurrentBookId() }),
        checkinUtil.loadAllCheckinRecords(),
        db.list(db.COLLECTIONS.TODO)
      ]);

      const allDates = [...new Set(checkinRecords.map(r => r.date))].sort();
      const streaks = checkinUtil.calcStreaks(allDates);
      const todoDone = todos.filter(t => t.completed).length;

      const defs = [
        { key: 'first_diary', icon: '📝', title: '初心者', desc: '写下第一篇日记', current: diaryCount, target: 1 },
        { key: 'accounting_10', icon: '💰', title: '记账入门', desc: '记账满 10 笔', current: accountingCount, target: 10 },
        { key: 'accounting_100', icon: '🏦', title: '记账达人', desc: '记账满 100 笔', current: accountingCount, target: 100 },
        { key: 'checkin_10', icon: '✅', title: '打卡新手', desc: '累计打卡 10 次', current: checkinRecords.length, target: 10 },
        { key: 'streak_7', icon: '🔥', title: '连续坚持', desc: '连续打卡 7 天', current: streaks.longest, target: 7 },
        { key: 'streak_30', icon: '⚡', title: '自律达人', desc: '连续打卡 30 天', current: streaks.longest, target: 30 },
        { key: 'todo_10', icon: '📋', title: '待办终结者', desc: '完成 10 个待办', current: todoDone, target: 10 },
        { key: 'todo_50', icon: '🎯', title: '待办大师', desc: '完成 50 个待办', current: todoDone, target: 50 }
      ];

      const badges = defs.map(d => {
        const unlocked = d.current >= d.target;
        const pct = Math.min(100, Math.round(d.current / d.target * 100));
        return { ...d, unlocked, pct, display: Math.min(d.current, d.target) + '/' + d.target };
      });

      this.setData({
        badges,
        unlockedCount: badges.filter(b => b.unlocked).length,
        totalCount: badges.length
      });
    } catch (e) {
      console.error('achievements loadBadges error:', e);
    }
  }
});