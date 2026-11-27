const tabState = require('../../../utils/tab-state.js');
const ui = require('../../../utils/interaction.js');
const db = require('../../../utils/db.js');
const theme = require('../../../utils/theme.js');
const user = require('../../../utils/user.js');
const bookUtil = require('../../../utils/book.js');
const dateUtil = require('../../../utils/date.js');
const checkinUtil = require('../../../utils/checkin.js');

const NICK_KEY = '__user_nickname';

Page({
  behaviors: [tabState.behavior],
  data: {
    themeStyle: '',
    themeId: 'default',
    nickname: '生活记录者',
    openIdTail: '',
    version: '1.0.0',
    streakDays: 0,
    monthAccounting: 0,
    summary: { accounting: 0, diary: 0, checkin: 0, todoDone: 0, movie: 0, reading: 0 },
    monthSummary: {
      expense: '0.00',
      income: '0.00',
      diary: 0,
      checkin: 0
    },
    menus: [
      { id: 'tabbar', icon: 'grip', title: '底部导航', path: '/pages/profile/tabbar/index' },
      { id: 'stats', icon: 'chart', title: '数据洞察', path: '/pages/stats/index/index' },
      { id: 'settings', icon: 'settings', title: '设置', path: '/pages/profile/settings/index' }
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

      let monthExpense = 0, monthIncome = 0, monthDiary = 0, monthCheckin = 0, monthAccounting = 0;
      if (accountingList) {
        accountingList.forEach(item => {
          const d = item.date || '';
          if (d >= monthStartStr && d <= monthEndStr && item.bookId === bookId) {
            monthAccounting++;
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
        const t = dateUtil.bizDateOf(d);
        return !!t && t >= monthStartStr && t <= monthEndStr;
      }).length;
      monthCheckin = (checkinList || []).filter(r => {
        const t = r.date || '';
        return t >= monthStartStr && t <= monthEndStr;
      }).length;

      // 连续打卡天数：复用 checkinUtil.calcStreaks（与数据洞察页口径一致）
      const checkinDates = [...new Set((checkinList || []).map(r => r.date).filter(Boolean))];
      const streakDays = checkinUtil.calcStreaks(checkinDates).current;

      this.setData({
        streakDays,
        monthAccounting,
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

  async editNickname() {
    const nick = await ui.promptInput({
      title: '修改昵称',
      value: this.data.nickname,
      placeholder: '输入新昵称'
    });
    if (nick === null) return;
    const finalNick = nick || '生活记录者';
    wx.setStorageSync(NICK_KEY, finalNick);
    this.setData({ nickname: finalNick });
    ui.toast('已保存');
  },

  goMenu(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({ url: path });
  },

  goOverview() {
    wx.navigateTo({ url: '/pages/stats/index/index' });
  },

  goTheme() {
    wx.navigateTo({ url: '/pages/profile/settings/index' });
  },

  goExport() {
    wx.navigateTo({ url: '/pages/profile/settings/index' });
  },

  onFeedback() {
    const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    const info = [
      '生活记 · 意见反馈',
      '版本：' + this.data.version,
      '机型：' + (sys.model || '未知'),
      '系统：' + (sys.system || '未知'),
      '微信版本：' + (sys.version || '未知'),
      '问题描述：【请在此填写】'
    ].join('\n');
    wx.showModal({
      title: '意见反馈',
      content: '将生成一段含版本与机型的信息复制到剪贴板，便于你通过小程序客服或社区反馈时一并粘贴，帮助定位问题。',
      confirmText: '复制信息',
      success: (res) => {
        if (!res.confirm) return;
        wx.setClipboardData({
          data: info,
          success: () => ui.toast('反馈信息已复制', 'success')
        });
      }
    });
  }
});
