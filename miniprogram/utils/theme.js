/**
 * 多主题系统 v3 · 生活记
 * 10 套主题：可爱 / 简约 / 手账 / 商务 / 奶油 / 森系 / 雾蓝 / 新中式 / 水彩 / 缤纷。
 * 每套主题是完整 token：颜色 + 圆角 + 图标色板。间距/字号全局一致，不随主题漂移。
 * 页面根节点通过 style="{{themeStyle}}" 承接，组件内 var(--xxx) 自动继承。
 * 暗黑模式已移除。
 */
const STORAGE_KEY = '__theme_config';

// 老主题 id 平滑迁移到新主题（v2 的 nature/data/paper/ios/night）
const LEGACY_IDS = {
  default: 'cute',
  nature: 'forest',
  forest: 'forest',
  data: 'business',
  paper: 'journal',
  ios: 'simple',
  night: 'business'
};

const FONT_HEI = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif';
const FONT_SERIF = '"Songti SC", "STSong", "SimSun", serif';

function makeTheme(id, name, o) {
  const c = Object.assign({
    '--health': '#C0857E', '--health-dark': '#9E6660',
    '--success': '#8FC9A8', '--success-light': '#EBF5F0',
    '--warning': '#E3C27D', '--warning-light': '#FBF4E5', '--warning-dark': '#C9973F',
    '--star': '#E3C27D',
    '--danger': '#D98E8C', '--danger-light': '#FBEDED',
    '--text-inverse': '#FFFFFF',
    '--shadow-sm': '0 2rpx 10rpx rgba(0,0,0,0.035)',
    '--shadow-md': '0 6rpx 24rpx rgba(0,0,0,0.06)',
    '--shadow-lg': '0 12rpx 40rpx rgba(0,0,0,0.09)',
    '--mask': 'rgba(0,0,0,0.42)', '--mask-strong': 'rgba(0,0,0,0.6)',
    '--font-hei': FONT_HEI
  }, o.colors);

  // 由 warning 推导深一档，供渐变/描边使用
  if (!c['--warning-dark']) c['--warning-dark'] = darken(c['--warning'] || '#E3C27D', 0.82);

  // 兼容别名：历史引用 --bg-card / --text-secondary / --divider 保持生效
  c['--bg-card'] = c['--bg-card'] || c['--surface'];
  c['--text-secondary'] = c['--text-secondary'] || c['--text-3'];
  c['--divider'] = c['--divider'] || c['--border'];
  c['--shadow-primary'] = c['--shadow-primary'] || buildPrimaryShadow(o.colors['--primary-dark'] || o.colors['--primary']);

  return {
    id: id,
    name: name,
    colors: c,
    layout: Object.assign({
      cardRadius: '24rpx', buttonRadius: '999rpx', cardPadding: '32rpx',
      iconRadius: '24rpx', compactMode: false
    }, o.layout),
    categoryColors: o.categoryColors || []
  };
}

function darken(hex, factor) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#C9973F';
  const n = parseInt(h, 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

// hex -> rgba 字符串，供 canvas 渐变填充使用（canvas 不支持 CSS var）
function hexToRgba(hex, alpha) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return 'rgba(74,144,217,' + alpha + ')';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function buildPrimaryShadow(color) {
  const h = String(color || '#4A90D9').replace('#', '');
  if (h.length !== 6) return '0 6rpx 18rpx rgba(74,144,217,0.2)';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return '0 6rpx 18rpx rgba(' + r + ',' + g + ',' + b + ',0.22)';
}

const PRESET_THEMES = {
  cute: makeTheme('cute', '可爱风', {
    colors: {
      '--primary': '#F4A8BC', '--primary-dark': '#D97A96', '--primary-light': '#FDE4EC',
      '--accent': '#A8D8C8',
      '--health': '#D98F9E', '--health-dark': '#B86F80',
      '--success': '#8FC9A8', '--success-light': '#E8F5EE',
      '--warning': '#F3C97A', '--warning-light': '#FDF4E3', '--star': '#F3C97A',
      '--danger': '#E58C8C', '--danger-light': '#FBEDED',
      '--text': '#5A4A50', '--text-2': '#7D6B72', '--text-3': '#A8939A',
      '--bg': '#FFFBF7', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#FDF3F5', '--surface-3': '#F7E7EC',
      '--border': '#F1DDE3'
    },
    layout: { cardRadius: '28rpx', buttonRadius: '999rpx', cardPadding: '32rpx', iconRadius: '999rpx' },
    categoryColors: ['#F4A8BC', '#A8D8C8', '#F6D68A', '#C9B6E4', '#A8CCE8', '#F5B898', '#BFD39A']
  }),

  simple: makeTheme('simple', '简约风', {
    colors: {
      '--primary': '#7A8A89', '--primary-dark': '#5F6E6D', '--primary-light': '#E8EEEC',
      '--accent': '#A8DCC8',
      '--health': '#C48C96', '--health-dark': '#A66E7A',
      '--success': '#8FC9A8', '--success-light': '#EBF5F0',
      '--warning': '#E8C878', '--warning-light': '#FBF5E6', '--star': '#E8C878',
      '--danger': '#D98E8A', '--danger-light': '#FBEDEC',
      '--text': '#3A4241', '--text-2': '#5F6968', '--text-3': '#8B9493',
      '--bg': '#FAFAF8', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#F2F5F3', '--surface-3': '#E8EDEB',
      '--border': '#E3E9E6'
    },
    layout: { cardRadius: '16rpx', buttonRadius: '16rpx', cardPadding: '28rpx', iconRadius: '20rpx' },
    categoryColors: ['#7A8A89', '#A8DCC8', '#D8C7A1', '#B9A7C9', '#A8C4D8', '#E2B49F', '#B6C99F']
  }),

  journal: makeTheme('journal', '手账风', {
    colors: {
      '--primary': '#C4A484', '--primary-dark': '#967452', '--primary-light': '#F1E5D6',
      '--accent': '#D9A5A0',
      '--health': '#C48A82', '--health-dark': '#A46A64',
      '--success': '#A6C496', '--success-light': '#EDF4E8',
      '--warning': '#E6C27A', '--warning-light': '#FCF4E4', '--star': '#E6C27A',
      '--danger': '#D98F86', '--danger-light': '#FBEBE9',
      '--text': '#4A3F35', '--text-2': '#6F6152', '--text-3': '#9B8B79',
      '--bg': '#FBF6EC', '--bg-card': '#FFFDF8',
      '--surface': '#FFFDF8', '--surface-2': '#F6ECD9', '--surface-3': '#EFE2CC',
      '--border': '#E8D9C2', '--font-hei': FONT_SERIF
    },
    layout: { cardRadius: '12rpx', buttonRadius: '8rpx', cardPadding: '32rpx', iconRadius: '12rpx' },
    categoryColors: ['#C4A484', '#D9A5A0', '#E6C27A', '#A6C496', '#B7A8D0', '#D8B7A4', '#9FB8A6']
  }),

  business: makeTheme('business', '商务风', {
    colors: {
      '--primary': '#34495E', '--primary-dark': '#253646', '--primary-light': '#E6ECF1',
      '--accent': '#D4BC8A',
      '--health': '#C27C7C', '--health-dark': '#A05F60',
      '--success': '#7FB79A', '--success-light': '#E8F4EE',
      '--warning': '#D8B36A', '--warning-light': '#FAF2E3', '--star': '#D8B36A',
      '--danger': '#C87C78', '--danger-light': '#F8EAE9',
      '--text': '#2C3842', '--text-2': '#556270', '--text-3': '#8A96A1',
      '--bg': '#F5F7F9', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#EFF2F5', '--surface-3': '#E4E9ED',
      '--border': '#DCE3E8'
    },
    layout: { cardRadius: '12rpx', buttonRadius: '8rpx', cardPadding: '28rpx', iconRadius: '8rpx' },
    categoryColors: ['#34495E', '#D4BC8A', '#7FAF9C', '#8CA9C4', '#B997B5', '#C99C86', '#A8B58F']
  }),

  cream: makeTheme('cream', '奶油治愈', {
    colors: {
      '--primary': '#E9C9A6', '--primary-dark': '#C89F73', '--primary-light': '#F7EADB',
      '--accent': '#E8B89B',
      '--health': '#D69890', '--health-dark': '#B6726C',
      '--success': '#9CBF9A', '--success-light': '#EDF5EC',
      '--warning': '#E3C27D', '--warning-light': '#FBF4E5', '--star': '#E3C27D',
      '--danger': '#D98E7F', '--danger-light': '#FBEBE7',
      '--text': '#5A4638', '--text-2': '#7E6956', '--text-3': '#A7927D',
      '--bg': '#FFFDF8', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#FAF2E8', '--surface-3': '#F2E5D5',
      '--border': '#EFE2D3'
    },
    layout: { cardRadius: '24rpx', buttonRadius: '999rpx', cardPadding: '32rpx', iconRadius: '28rpx' },
    categoryColors: ['#E9C9A6', '#F7EADB', '#E8B89B', '#BFC9A6', '#A9BFD0', '#D6B4C2', '#C89F73']
  }),

  forest: makeTheme('forest', '森系自然', {
    colors: {
      '--primary': '#7C8F74', '--primary-dark': '#5A6E57', '--primary-light': '#EAF0E4',
      '--accent': '#C08A70',
      '--health': '#C0857E', '--health-dark': '#9E6660',
      '--success': '#8FB08B', '--success-light': '#EBF4E8',
      '--warning': '#D0B377', '--warning-light': '#FAF3E5', '--star': '#D0B377',
      '--danger': '#C4867E', '--danger-light': '#F9EBE8',
      '--text': '#3E4A3C', '--text-2': '#63705E', '--text-3': '#909B89',
      '--bg': '#F8F7F2', '--bg-card': '#FFFEFB',
      '--surface': '#FFFEFB', '--surface-2': '#EFF2E9', '--surface-3': '#E3E9DA',
      '--border': '#E1E5D9'
    },
    layout: { cardRadius: '20rpx', buttonRadius: '999rpx', cardPadding: '30rpx', iconRadius: '24rpx' },
    categoryColors: ['#7C8F74', '#EAF0E4', '#C08A70', '#8FB08B', '#8CA9B8', '#C4A7C0', '#A8B58F']
  }),

  mist: makeTheme('mist', '雾蓝海洋', {
    colors: {
      '--primary': '#8FB3C7', '--primary-dark': '#5F8299', '--primary-light': '#EAF3F6',
      '--accent': '#E8DCC8',
      '--health': '#C98B93', '--health-dark': '#A66B73',
      '--success': '#8BBFA8', '--success-light': '#EAF5EF',
      '--warning': '#D9C083', '--warning-light': '#FAF3E4', '--star': '#D9C083',
      '--danger': '#D08D87', '--danger-light': '#F9ECEA',
      '--text': '#3A4E5A', '--text-2': '#5F7684', '--text-3': '#8DA3AF',
      '--bg': '#F6FAFB', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#EDF4F7', '--surface-3': '#E1ECF1',
      '--border': '#DCE8EC'
    },
    layout: { cardRadius: '20rpx', buttonRadius: '999rpx', cardPadding: '30rpx', iconRadius: '24rpx' },
    categoryColors: ['#8FB3C7', '#EAF3F6', '#E8DCC8', '#8BBFA8', '#B8A7CE', '#E0B49F', '#A8C4D8']
  }),

  oriental: makeTheme('oriental', '新中式雅集', {
    colors: {
      '--primary': '#5A6F6D', '--primary-dark': '#435653', '--primary-light': '#E8E6D8',
      '--accent': '#C87A6B',
      '--health': '#BF7A72', '--health-dark': '#9D5B56',
      '--success': '#7E9A7B', '--success-light': '#EAF1E7',
      '--warning': '#C7A05E', '--warning-light': '#F8F1E3', '--star': '#C7A05E',
      '--danger': '#B96A5C', '--danger-light': '#F7E9E5',
      '--text': '#2F3735', '--text-2': '#56615D', '--text-3': '#878F8A',
      '--bg': '#F8F5EC', '--bg-card': '#FFFCF4',
      '--surface': '#FFFCF4', '--surface-2': '#F0EBDD', '--surface-3': '#E5DFCD',
      '--border': '#E2DCCB', '--font-hei': FONT_SERIF
    },
    layout: { cardRadius: '8rpx', buttonRadius: '6rpx', cardPadding: '32rpx', iconRadius: '8rpx' },
    categoryColors: ['#5A6F6D', '#E8E6D8', '#C87A6B', '#7E9A7B', '#9A8CB0', '#C9A98C', '#A8B89F']
  }),

  watercolor: makeTheme('watercolor', '水彩柔彩', {
    colors: {
      '--primary': '#B4A7D0', '--primary-dark': '#8B7BB0', '--primary-light': '#F0EAF8',
      '--accent': '#9FC7D6',
      '--health': '#CE8AA0', '--health-dark': '#A96A82',
      '--success': '#95BFA8', '--success-light': '#ECF5EF',
      '--warning': '#E0C080', '--warning-light': '#FBF4E6', '--star': '#E0C080',
      '--danger': '#D48C96', '--danger-light': '#FBECEF',
      '--text': '#4A4456', '--text-2': '#6E667E', '--text-3': '#9A93A8',
      '--bg': '#FBF9FE', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#F3EFFA', '--surface-3': '#E9E2F4',
      '--border': '#E6E1EE'
    },
    layout: { cardRadius: '28rpx', buttonRadius: '999rpx', cardPadding: '32rpx', iconRadius: '999rpx' },
    categoryColors: ['#B4A7D0', '#F0EAF8', '#9FC7D6', '#95BFA8', '#E6B8C8', '#E0C080', '#C4B8DC']
  }),

  // 第 10 套：缤纷风 —— 高饱和撞色，与账单类目图标同色板。主色取紫、强调黄，圆角偏轻。
  fenbin: makeTheme('fenbin', '缤纷风', {
    colors: {
      '--primary': '#9775FA', '--primary-dark': '#7B57E0', '--primary-light': '#EFE8FF',
      '--accent': '#FFD43B',
      '--health': '#22B8CF', '--health-dark': '#1896AA',
      '--success': '#51CF66', '--success-light': '#E6F9EA',
      '--warning': '#FFA94D', '--warning-light': '#FFF1E4', '--star': '#FFD43B',
      '--danger': '#FF6B6B', '--danger-light': '#FFE9E9',
      '--text': '#364A66', '--text-2': '#5B6B82', '--text-3': '#93A0B2',
      '--bg': '#FFFDF8', '--bg-card': '#FFFFFF',
      '--surface': '#FFFFFF', '--surface-2': '#F1F5F9', '--surface-3': '#E8EEF6',
      '--border': '#EAE4F5'
    },
    layout: { cardRadius: '22rpx', buttonRadius: '999rpx', cardPadding: '30rpx', iconRadius: '16rpx' },
    categoryColors: ['#FF6B6B', '#FFA94D', '#FFD43B', '#51CF66', '#22B8CF', '#4DABF7', '#9775FA']
  })
};

let currentConfig = null;

function getDefaultConfig() {
  return {
    themeId: 'fenbin',
    headerImage: '',
    iconPack: 'default',
    customColors: null,
    customLayout: null
  };
}

function loadConfig() {
  if (currentConfig) return currentConfig;
  let saved = null;
  try { saved = wx.getStorageSync(STORAGE_KEY); } catch (e) {}
  currentConfig = saved || getDefaultConfig();
  if (LEGACY_IDS[currentConfig.themeId]) {
    currentConfig.themeId = LEGACY_IDS[currentConfig.themeId];
  }
  if (!PRESET_THEMES[currentConfig.themeId]) currentConfig.themeId = 'fenbin';
  return currentConfig;
}

function saveConfig(config) {
  currentConfig = Object.assign({}, currentConfig || getDefaultConfig(), config);
  try { wx.setStorageSync(STORAGE_KEY, currentConfig); } catch (e) {}
  return currentConfig;
}

function getActiveTheme() {
  const config = loadConfig();
  const preset = PRESET_THEMES[config.themeId] || PRESET_THEMES.fenbin;
  const result = Object.assign({}, preset);
  if (config.customColors) {
    result.colors = Object.assign({}, preset.colors, config.customColors);
  }
  if (config.customLayout) {
    result.layout = Object.assign({}, preset.layout, config.customLayout);
  }
  return result;
}

// 页面根节点 style 字符串：颜色 + 圆角 + 阴影 + 标题字体
function buildStyleVars(theme) {
  const parts = [];
  Object.keys(theme.colors).forEach(key => parts.push(key + ':' + theme.colors[key]));
  const l = theme.layout || {};
  if (l.cardRadius) parts.push('--radius-md:' + l.cardRadius);
  if (l.buttonRadius) parts.push('--radius-full:' + l.buttonRadius);
  if (l.cardPadding) parts.push('--card-padding:' + l.cardPadding);
  if (l.iconRadius) parts.push('--icon-radius:' + l.iconRadius);
  return parts.join(';');
}

function applyToPage(page) {
  if (!page || !page.setData) return;
  const theme = getActiveTheme();
  page.setData({
    themeStyle: buildStyleVars(theme),
    themeId: theme.id,
    themeName: theme.name,
    isDark: false
  });
  try {
    wx.setBackgroundColor({ backgroundColor: theme.colors['--bg'] });
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: theme.colors['--bg-card'],
      animation: { duration: 200, timingFunc: 'easeIn' }
    });
  } catch (e) {}
}

function setTheme(themeId) {
  if (!PRESET_THEMES[themeId]) return false;
  saveConfig({ themeId: themeId });
  return true;
}

// 分类图标色板：返回 7 色数组，按主题映射
function getCategoryColors(themeId) {
  const id = themeId || loadConfig().themeId;
  const t = PRESET_THEMES[id] || PRESET_THEMES.cute;
  return t.categoryColors.slice();
}

// 分类名 -> 色板索引：语义稳定，切主题只换色不换含义
const CATEGORY_INDEX = {
  food: 0, dining: 0, meal: 0, breakfast: 0, lunch: 0, dinner: 0,
  transport: 1, traffic: 1, travel: 1, bus: 1, car: 1,
  shopping: 2, shop: 2, mall: 2, clothes: 2,
  entertainment: 3, movie: 3, fun: 3, game: 3,
  health: 4, medical: 4, medicine: 4, exercise: 4, sport: 4,
  social: 5, friend: 5, gift: 5, anniversary: 5,
  other: 6, misc: 6, default: 6, income: 6, salary: 6
};

function categoryColor(key, themeId) {
  const colors = getCategoryColors(themeId);
  const idx = CATEGORY_INDEX[String(key || '').toLowerCase()];
  return colors[idx === undefined ? 6 : idx];
}

// Canvas 图表色板：从当前主题 token 派生，canvas 无法用 CSS var，必须取实际色值
function getChartPalette(themeId) {
  const t = themeId ? (PRESET_THEMES[themeId] || getActiveTheme()) : getActiveTheme();
  const c = t.colors;
  const series = (t.categoryColors || []).slice();
  return {
    primary: c['--primary'],
    primaryDark: c['--primary-dark'],
    health: c['--health'],
    healthDark: c['--health-dark'],
    success: c['--success'],
    warning: c['--warning'],
    warningDark: c['--warning-dark'],
    danger: c['--danger'],
    accent: c['--accent'],
    text: c['--text-3'] || c['--text-2'],
    grid: c['--border'] || '#EFEFEF',
    surface: c['--surface'] || '#FFFFFF',
    series: series.length ? series : ['#F4A8BC', '#A8D8C8', '#F6D68A', '#C9B6E4', '#A8CCE8', '#F5B898', '#BFD39A']
  };
}

function setCustomColors(colors) { saveConfig({ customColors: colors }); }
function setCustomLayout(layout) { saveConfig({ customLayout: layout }); }
function setHeaderImage(imageUrl) { saveConfig({ headerImage: imageUrl }); }

function reset() {
  try { wx.removeStorageSync(STORAGE_KEY); } catch (e) {}
  currentConfig = null;
}

module.exports = {
  PRESET_THEMES: PRESET_THEMES,
  loadConfig: loadConfig,
  saveConfig: saveConfig,
  getActiveTheme: getActiveTheme,
  buildStyleVars: buildStyleVars,
  applyToPage: applyToPage,
  setTheme: setTheme,
  getCategoryColors: getCategoryColors,
  categoryColor: categoryColor,
  getChartPalette: getChartPalette,
  hexToRgba: hexToRgba,
  darken: darken,
  setCustomColors: setCustomColors,
  setCustomLayout: setCustomLayout,
  setHeaderImage: setHeaderImage,
  reset: reset,
  themeIds: Object.keys(PRESET_THEMES)
};
