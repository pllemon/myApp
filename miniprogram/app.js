let user = null;
let theme = null;
try { user = require('./utils/user.js'); } catch (e) { console.error('user.js load failed:', e); }
try { theme = require('./utils/theme.js'); } catch (e) { console.error('theme.js load failed:', e); }

const config = require('./utils/config.js');

function initCloud() {
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    return false;
  }
  if (!config.CLOUD_ENV) {
    console.warn('未配置云环境 ID (config.CLOUD_ENV)，跳过云初始化');
    return false;
  }
  try {
    wx.cloud.init({ env: config.CLOUD_ENV, traceUser: true });
    return true;
  } catch (e) {
    console.error('cloud init error:', e);
    return false;
  }
}

App({
  onLaunch: function () {
    this.globalData = {
      env: config.CLOUD_ENV,
      userInfo: null,
      openId: null,
      theme: null
    };

    if (user && user.init) {
      try {
        this.globalData.openId = user.init();
      } catch (e) { console.error('user.init error:', e); }
    }

    if (theme && theme.getActiveTheme) {
      try {
        this.globalData.theme = theme.getActiveTheme();
      } catch (e) { console.error('theme.getActiveTheme error:', e); }
    }

    if (config.STORAGE_MODE === 'cloud') {
      initCloud();
    }
  },

  initCloud: initCloud,

  onThemeChange: function () {
    if (theme && theme.getActiveTheme) {
      this.globalData.theme = theme.getActiveTheme();
    }
  },

  globalData: {
    env: '',
    userInfo: null,
    openId: null,
    theme: null
  }
});