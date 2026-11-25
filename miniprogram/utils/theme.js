const STORAGE_KEY = '__theme_config';

const PRESET_THEMES = {
  default: {
    id: 'default',
    name: '默认蓝',
    colors: {
      '--primary': '#4A90D9',
      '--primary-dark': '#357ABD',
      '--primary-light': '#E8F0FA',
      '--accent': '#FF6B6B',
      '--success': '#52C41A',
      '--warning': '#FAAD14',
      '--danger': '#FF4D4F',
      '--bg': '#FAFAFA',
      '--bg-card': '#FFFFFF',
      '--text': '#333333',
      '--text-secondary': '#999999',
      '--divider': '#EEEEEE'
    },
    layout: {
      cardRadius: '16rpx',
      buttonRadius: '48rpx',
      cardPadding: '32rpx',
      compactMode: false
    }
  },
  warm: {
    id: 'warm',
    name: '温暖橙',
    colors: {
      '--primary': '#F5A623',
      '--primary-dark': '#E08E0C',
      '--primary-light': '#FFF5E0',
      '--accent': '#E94E77',
      '--success': '#7ED321',
      '--warning': '#FF8C00',
      '--danger': '#FF3B30',
      '--bg': '#FFFBF5',
      '--bg-card': '#FFFFFF',
      '--text': '#4A3728',
      '--text-secondary': '#A89B8C',
      '--divider': '#F0EBE3'
    },
    layout: {
      cardRadius: '24rpx',
      buttonRadius: '56rpx',
      cardPadding: '36rpx',
      compactMode: false
    }
  },
  forest: {
    id: 'forest',
    name: '自然绿',
    colors: {
      '--primary': '#2E7D5B',
      '--primary-dark': '#1F5A3F',
      '--primary-light': '#E6F4EC',
      '--accent': '#8BC34A',
      '--success': '#4CAF50',
      '--warning': '#FFB300',
      '--danger': '#E53935',
      '--bg': '#F4F8F5',
      '--bg-card': '#FFFFFF',
      '--text': '#2C3E35',
      '--text-secondary': '#8FA89A',
      '--divider': '#E8EFE9'
    },
    layout: {
      cardRadius: '20rpx',
      buttonRadius: '48rpx',
      cardPadding: '32rpx',
      compactMode: false
    }
  },
  night: {
    id: 'night',
    name: '暗黑模式',
    colors: {
      '--primary': '#64B5F6',
      '--primary-dark': '#42A5F5',
      '--primary-light': '#1E3A5F',
      '--accent': '#FF8A65',
      '--success': '#66BB6A',
      '--warning': '#FFA726',
      '--danger': '#EF5350',
      '--bg': '#1A1A2E',
      '--bg-card': '#252540',
      '--text': '#ECECEC',
      '--text-secondary': '#9E9EB8',
      '--divider': '#353550'
    },
    layout: {
      cardRadius: '16rpx',
      buttonRadius: '40rpx',
      cardPadding: '28rpx',
      compactMode: true
    }
  }
};

let currentConfig = null;

function getDefaultConfig() {
  return {
    themeId: 'default',
    headerImage: '',
    iconPack: 'default',
    customColors: null,
    customLayout: null
  };
}

function loadConfig() {
  if (currentConfig) return currentConfig;
  const saved = wx.getStorageSync(STORAGE_KEY);
  currentConfig = saved || getDefaultConfig();
  return currentConfig;
}

function saveConfig(config) {
  currentConfig = Object.assign({}, currentConfig || getDefaultConfig(), config);
  wx.setStorageSync(STORAGE_KEY, currentConfig);
  return currentConfig;
}

function getActiveTheme() {
  const config = loadConfig();
  const preset = PRESET_THEMES[config.themeId] || PRESET_THEMES.default;
  const result = Object.assign({}, preset);
  if (config.customColors) {
    result.colors = Object.assign({}, preset.colors, config.customColors);
  }
  if (config.customLayout) {
    result.layout = Object.assign({}, preset.layout, config.customLayout);
  }
  return result;
}

function applyToPage(page) {
  if (!page || !page.setData) return;
  const theme = getActiveTheme();
  const styleVars = [];
  Object.keys(theme.colors).forEach(key => {
    styleVars.push(key + ': ' + theme.colors[key]);
  });
  page.setData({
    themeStyle: styleVars.join('; '),
    themeId: theme.id,
    isDark: theme.id === 'night'
  });
}

function setTheme(themeId) {
  if (!PRESET_THEMES[themeId]) return false;
  saveConfig({ themeId: themeId });
  return true;
}

function setCustomColors(colors) {
  saveConfig({ customColors: colors });
}

function setCustomLayout(layout) {
  saveConfig({ customLayout: layout });
}

function setHeaderImage(imageUrl) {
  saveConfig({ headerImage: imageUrl });
}

function reset() {
  wx.removeStorageSync(STORAGE_KEY);
  currentConfig = null;
}

module.exports = {
  PRESET_THEMES: PRESET_THEMES,
  loadConfig: loadConfig,
  saveConfig: saveConfig,
  getActiveTheme: getActiveTheme,
  applyToPage: applyToPage,
  setTheme: setTheme,
  setCustomColors: setCustomColors,
  setCustomLayout: setCustomLayout,
  setHeaderImage: setHeaderImage,
  reset: reset,
  themeIds: Object.keys(PRESET_THEMES)
};