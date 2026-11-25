const db = require('../../../utils/db.js');
const config = require('../../../utils/config.js');
const theme = require('../../../utils/theme.js');
const statsCache = require('../../../utils/stats-cache.js');
const tabConfig = require('../../../utils/tabbar-config.js');

const THEME_LIST = (() => {
  const t = theme.PRESET_THEMES;
  return Object.keys(t).map(id => ({ id, name: t[id].name, primary: t[id].colors['--primary'] }));
})();

Page({
  data: {
    themeStyle: '',
    themeId: 'default',
    themeList: THEME_LIST,
    storageMode: 'local',
    version: '1.0.0'
  },

  onLoad() {
    theme.applyToPage(this);
    this.setData({ storageMode: db.mode, themeId: theme.loadConfig().themeId });
  },

  onShow() {
    theme.applyToPage(this);
    this.setData({ storageMode: db.mode, themeId: theme.loadConfig().themeId });
  },

  selectTheme(e) {
    const { id } = e.currentTarget.dataset;
    if (id === this.data.themeId) return;
    theme.setTheme(id);
    theme.applyToPage(this);
    const app = getApp();
    if (app && app.onThemeChange) app.onThemeChange();

    const active = theme.getActiveTheme();
    tabConfig.updateTheme({
      color: active.colors['--text-secondary'],
      selectedColor: active.colors['--primary'],
      bgColor: active.colors['--bg-card'],
      borderColor: active.colors['--divider']
    });
    this.setData({ themeId: id });
    wx.showToast({ title: '主题已切换', icon: 'success' });
  },

  switchMode(e) {
    const { mode } = e.currentTarget.dataset;
    if (mode === db.mode) return;
    if (mode === 'cloud' && !config.CLOUD_ENV) {
      wx.showToast({ title: '暂未配置云环境', icon: 'none' });
      return;
    }
    db.switchMode(mode);
    this.setData({ storageMode: db.mode });
    wx.showToast({ title: '已切换到' + (mode === 'cloud' ? '云端' : '本地') + '模式', icon: 'success' });
  },

  async exportData() {
    if (db.mode !== 'local') {
      wx.showToast({ title: '仅本地模式支持导出', icon: 'none' });
      return;
    }
    try {
      const all = await db.exportAll();
      const json = JSON.stringify(all);
      wx.setClipboardData({
        data: json,
        success: () => wx.showToast({ title: '数据已复制到剪贴板', icon: 'none' })
      });
    } catch (e) {
      console.error('exportData error:', e);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  clearAllData() {
    wx.showModal({
      title: '⚠️ 清除全部数据',
      content: '将删除所有本地记账、日记、打卡、待办、主题等数据，且不可恢复。确定继续？',
      confirmText: '全部清除',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (!res.confirm) return;
        try {
          wx.clearStorageSync();
          statsCache.clear();
          wx.showModal({
            title: '已清除',
            content: '数据已清空，请重启小程序以重新初始化。',
            showCancel: false
          });
        } catch (e) {
          console.error('clearAllData error:', e);
        }
      }
    });
  }
});