const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
const config = require('../../../utils/config.js');
const theme = require('../../../utils/theme.js');
const statsCache = require('../../../utils/stats-cache.js');
const tabConfig = require('../../../utils/tabbar-config.js');
const backupUtil = require('../../../utils/backup.js');

// 主题卡片：名称 + 三色预览（主色 / 浅主色 / 强调色）
const THEME_LIST = (() => {
  const t = theme.PRESET_THEMES;
  return Object.keys(t).map(id => {
    const c = t[id].colors;
    return {
      id: id,
      name: t[id].name,
      primary: c['--primary'],
      light: c['--primary-light'],
      accent: c['--accent']
    };
  });
})();

Page({
  data: {
    themeStyle: '',
    themeId: 'fenbin',
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
    ui.toast('主题已切换');
  },

  switchMode(e) {
    const { mode } = e.currentTarget.dataset;
    if (mode === db.mode) return;
    if (mode === 'cloud' && !config.CLOUD_ENV) {
      ui.toast('暂未配置云环境', 'none');
      return;
    }
    db.switchMode(mode);
    this.setData({ storageMode: db.mode });
    ui.toast('已切换到' + (mode === 'cloud' ? '云端' : '本地') + '模式');
  },

  async exportData() {
    if (db.mode !== 'local') {
      ui.toast('仅本地模式支持导出', 'none');
      return;
    }
    try {
      const all = await db.exportAll();
      const json = JSON.stringify(all);
      wx.setClipboardData({
        data: json,
        success: () => ui.toast('数据已复制到剪贴板', 'none')
      });
    } catch (e) {
      console.error('exportData error:', e);
      ui.toast('导出失败', 'none');
    }
  },

  async exportBackupFile() {
    if (db.mode !== 'local') {
      ui.toast('仅本地模式支持备份', 'none');
      return;
    }
    try {
      const result = await backupUtil.exportToFile();
      if (!result.canceled) {
        wx.showToast({ title: `已备份 ${result.count} 项数据`, icon: 'success' });
      }
    } catch (e) {
      ui.toast(e.message || '备份失败', 'none');
    }
  },

  async restoreBackup() {
    if (db.mode !== 'local') {
      ui.toast('仅本地模式支持恢复', 'none');
      return;
    }
    try {
      const picked = await backupUtil.pickAndReadFile();
      if (!picked) return;
      const count = picked.keys.length;
      const ok = await ui.confirmAction({
        title: '确认恢复备份',
        content: `即将用备份中的 ${count} 项数据覆盖当前全部数据，覆盖后当前未备份的记录将无法找回。确定继续？`,
        confirmText: '覆盖恢复'
      });
      if (!ok) return;
      const restored = await backupUtil.restoreBackup(picked.backup);
      wx.showToast({ title: `已恢复 ${restored} 项数据`, icon: 'success' });
    } catch (e) {
      console.error('restoreBackup error:', e);
      ui.toast(e.message || '恢复失败', 'none');
    }
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/profile/privacy/index' });
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
  },

  clearCache() {
    try {
      statsCache.clear();
      wx.showToast({ title: '统计缓存已清理', icon: 'success' });
    } catch (e) {
      ui.toast('清理失败', 'none');
    }
  },

  clearAllData() {
    ui.confirmActionWith({
      title: '清除全部数据',
      content: '将删除所有本地记账、日记、打卡、待办、主题等数据，且不可恢复。确定继续？',
      confirmText: '全部清除'
    }, (res) => {
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
    });
  }
});
