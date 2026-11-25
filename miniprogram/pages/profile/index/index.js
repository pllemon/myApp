const db = require('../../../utils/db.js');
const theme = require('../../../utils/theme.js');
const user = require('../../../utils/user.js');
const bookUtil = require('../../../utils/book.js');
const dateUtil = require('../../../utils/date.js');

const NICK_KEY = '__user_nickname';

Page({
  data: {
    themeStyle: '',
    themeId: 'default',
    nickname: '生活记录者',
    openIdTail: '',
    summary: { accounting: 0, diary: 0, checkin: 0, todoDone: 0, movie: 0, reading: 0 },
    monthSummary: {
      expense: '0.00',
      income: '0.00',
      diary: 0,
      checkin: 0
    },
    menus: [
      { id: 'tabbar', icon: '🔀', title: '自定义TabBar', path: '/pages/profile/tabbar/index' },
      { id: 'stats', icon: '📊', title: '数据洞察', path: '/pages/stats/index/index' },
      { id: 'achievements', icon: '🏆', title: '成就徽章', path: '/pages/profile/achievements/index' },
      { id: 'settings', icon: '⚙️', title: '设置', path: '/pages/profile/settings/index' }
    ]
  },

  onLoad() {
    theme.applyToPage(this);
    const openId = user.getOpenId() || '';
    this.setData({ openIdTail: openId.slice(-6) });
  },

  onShow() {
    theme.applyToPage(this);
    const nick = wx.getStorageSync(NICK_KEY);
    if (nick) this.setData({ nickname: nick });
    this.loadSummary();
  },

  async loadSummary() {
    try {
      const bookId = bookUtil.getCurrentBookId();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = dateUtil.formatDate(monthStart);
      const monthEndStr = dateUtil.formatDate(now);

      const [accountingList, diary, checkin, todos, movie, reading] = await Promise.all([
        db.list(db.COLLECTIONS.ACCOUNTING, { key: 'createdAt', order: 'desc' }),
        db.count(db.COLLECTIONS.DIARY),
        db.count(db.COLLECTIONS.CHECKIN_RECORD),
        db.list(db.COLLECTIONS.TODO),
        db.count(db.COLLECTIONS.MOVIE),
        db.count(db.COLLECTIONS.READING)
      ]);

      let monthExpense = 0, monthIncome = 0, monthDiary = 0, monthCheckin = 0;
      if (accountingList) {
        accountingList.forEach(item => {
          const d = item.date || '';
          if (d >= monthStartStr && d <= monthEndStr && item.bookId === bookId) {
            const amt = parseFloat(item.amount) || 0;
            if (item.type === 'expense') monthExpense += amt;
            else monthIncome += amt;
          }
        });
      }

      const [diaryList, checkinList] = await Promise.all([
        db.list(db.COLLECTIONS.DIARY),
        db.list(db.COLLECTIONS.CHECKIN_RECORD)
      ]);
      monthDiary = (diaryList || []).filter(d => {
        const t = dateUtil.formatDate(d.createdAt || '');
        return t >= monthStartStr && t <= monthEndStr;
      }).length;
      monthCheckin = (checkinList || []).filter(r => {
        const t = r.date || '';
        return t >= monthStartStr && t <= monthEndStr;
      }).length;

      this.setData({
        summary: {
          accounting: accountingList ? accountingList.filter(i => i.bookId === bookId).length : 0,
          diary,
          checkin,
          todoDone: todos.filter(t => t.completed).length,
          movie,
          reading
        },
        monthSummary: {
          expense: monthExpense.toFixed(2),
          income: monthIncome.toFixed(2),
          diary: monthDiary,
          checkin: monthCheckin
        }
      });
    } catch (e) {
      console.error('profile loadSummary error:', e);
    }
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '输入新昵称',
      content: this.data.nickname,
      success: (res) => {
        if (!res.confirm) return;
        const nick = (res.content || '').trim() || '生活记录者';
        wx.setStorageSync(NICK_KEY, nick);
        this.setData({ nickname: nick });
      }
    });
  },

  goMenu(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({ url: path });
  }
});