const theme = require('./theme.js');

const STORAGE_KEY = '__tabbar_config';
const SELECTED_KEY = '__tabbar_selected';
const SHORTCUT_KEY = '__shortcut_selected'; // 旧版快捷入口配置，读取后迁移清除

const MIN_COUNT = 3;
const MAX_COUNT = 5;
const MIDDLE_MIN = MIN_COUNT - 2;
const MIDDLE_MAX = MAX_COUNT - 2;

// 单一候选池：14 个模块。首页 / 我的固定，其余最多选 3 个进入底部。
const MODULES = [
  { id: 'home',        pagePath: '/pages/home/index/index',        text: '首页',     icon: 'home',     fixed: true },
  { id: 'diary',       pagePath: '/pages/diary/index/index',       text: '日记',     icon: 'note',     fixed: false },
  { id: 'accounting',  pagePath: '/pages/accounting/index/index',  text: '记账',     icon: 'wallet',   fixed: false },
  { id: 'health',      pagePath: '/pages/health/index/index',      text: '健康',     icon: 'pulse',    fixed: false },
  { id: 'checkin',     pagePath: '/pages/checkin/index/index',     text: '打卡',     icon: 'check',    fixed: false },
  { id: 'todo',        pagePath: '/pages/todo/index/index',        text: '待办',     icon: 'list',     fixed: false },
  { id: 'stats',       pagePath: '/pages/stats/index/index',       text: '统计',     icon: 'chart',    fixed: false },
  { id: 'calendar',    pagePath: '/pages/calendar/index/index',    text: '日历',     icon: 'calendar', fixed: false },
  { id: 'timeline',    pagePath: '/pages/timeline/index/index',    text: '时间线',   icon: 'clock',    fixed: false },
  { id: 'anniversary', pagePath: '/pages/anniversary/index/index', text: '纪念日',   icon: 'giftline', fixed: false },
  { id: 'wishlist',    pagePath: '/pages/wishlist/index/index',    text: '愿望清单', icon: 'star',     fixed: false },
  { id: 'reading',     pagePath: '/pages/reading/index/index',     text: '阅读',     icon: 'bookline', fixed: false },
  { id: 'movie',       pagePath: '/pages/movie/index/index',       text: '观影',     icon: 'play',     fixed: false },
  { id: 'profile',     pagePath: '/pages/profile/index/index',     text: '我的',     icon: 'user',     fixed: true }
];

const DEFAULT_IDS = ['home', 'diary', 'accounting', 'health', 'profile'];
const PRESETS = [
  { id: 'default', name: '默认', defaultIds: DEFAULT_IDS }
];

const COLORS = {
  color: '#999999',
  selectedColor: '#333333',
  backgroundColor: '#FFFFFF',
  borderColor: '#eeeeee'
};

// 主题色兜底：用户未保存自定义配色时，跟随当前主题
function applyThemeDefaults() {
  const c = theme.getActiveTheme().colors;
  const defaults = {
    color: c['--text-3'] || '#999999',
    selectedColor: c['--primary-dark'] || '#333333',
    backgroundColor: c['--bg-card'] || '#FFFFFF',
    borderColor: c['--border'] || '#eeeeee'
  };
  Object.keys(defaults).forEach(k => { COLORS[k] = defaults[k]; });
}

function loadThemeColors() {
  applyThemeDefaults();
  try {
    const saved = wx.getStorageSync(STORAGE_KEY);
    if (saved && saved.colors && typeof saved.colors === 'object') {
      Object.keys(saved.colors).forEach(k => {
        if (k in COLORS && typeof saved.colors[k] === 'string') COLORS[k] = saved.colors[k];
      });
    }
  } catch (e) {}
}

// 把任意旧配置归一成：首页 + 1~3 个中间项 + 我的
function normalizeIds(raw) {
  const ids = Array.isArray(raw) ? raw : [];
  const middle = [];
  ids.forEach(id => {
    if (id === 'home' || id === 'profile') return;
    if (middle.indexOf(id) < 0 && MODULES.some(m => m.id === id)) middle.push(id);
  });

  const middleIds = middle.slice(0, MIDDLE_MAX);
  DEFAULT_IDS.slice(1, -1).forEach(id => {
    if (middleIds.length < MIDDLE_MIN && middleIds.indexOf(id) < 0) middleIds.push(id);
  });

  return ['home'].concat(middleIds, ['profile']);
}

function setSelectedIds(ids) {
  const normalized = normalizeIds(ids);
  try {
    wx.setStorageSync(SELECTED_KEY, normalized);
    wx.removeStorageSync(SHORTCUT_KEY);
  } catch (e) {}
  return normalized;
}

function getSelectedIds() {
  let raw = null;
  try { raw = wx.getStorageSync(SELECTED_KEY); } catch (e) {}
  // 没有保存过配置时用完整默认 5 项；只有显式保存过的配置才走归一化
  const normalized = (Array.isArray(raw) && raw.length > 0) ? normalizeIds(raw) : DEFAULT_IDS.slice();

  // 老用户配置迁移：结构不同就回写一次；旧快捷入口配置不再需要
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
    setSelectedIds(normalized);
  } else {
    try {
      const legacy = wx.getStorageSync(SHORTCUT_KEY);
      if (legacy !== '' && legacy !== undefined && legacy !== null) wx.removeStorageSync(SHORTCUT_KEY);
    } catch (e) {}
  }
  return normalized;
}

function buildListFromIds(ids) {
  return normalizeIds(ids).map(id => {
    const c = MODULES.find(x => x.id === id);
    return {
      id: c.id,
      pagePath: c.pagePath,
      text: c.text,
      icon: c.icon,
      fixed: c.fixed
    };
  });
}

function loadConfig() {
  loadThemeColors();
  return {
    list: buildListFromIds(getSelectedIds()),
    color: COLORS.color,
    selectedColor: COLORS.selectedColor,
    backgroundColor: COLORS.backgroundColor,
    bgColor: COLORS.backgroundColor,
    borderColor: COLORS.borderColor
  };
}

// 首页「更多」自动取所有未放到底部的中间模块
function getMoreIds() {
  const selected = new Set(getSelectedIds());
  return MODULES.filter(m => !m.fixed && !selected.has(m.id)).map(m => m.id);
}

function saveConfig(config) {
  try { wx.setStorageSync(STORAGE_KEY, config); } catch (e) {}
}

// 主题切换时由设置页调用，写入配色并持久化
function updateTheme(colors) {
  if (!colors || typeof colors !== 'object') return;
  const normalized = Object.assign({}, colors);
  if (normalized.bgColor !== undefined && normalized.backgroundColor === undefined) {
    normalized.backgroundColor = normalized.bgColor;
  }
  Object.keys(normalized).forEach(k => {
    if (k in COLORS && typeof normalized[k] === 'string') COLORS[k] = normalized[k];
  });
  saveConfig({ colors: Object.assign({}, COLORS) });
}

function getCandidates() { return MODULES; }
function getPresets() { return PRESETS; }
function getPreset(id) { return PRESETS.find(p => p.id === id); }

function findIdByPath(path) {
  const c = MODULES.find(x => x.pagePath === path);
  return c ? c.id : null;
}
function findPathById(id) {
  const c = MODULES.find(x => x.id === id);
  return c ? c.pagePath : null;
}

module.exports = {
  STORAGE_KEY,
  SELECTED_KEY,
  MIN_COUNT,
  MAX_COUNT,
  MIDDLE_MIN,
  MIDDLE_MAX,
  CANDIDATES: MODULES,
  loadConfig,
  saveConfig,
  getSelectedIds,
  setSelectedIds,
  getMoreIds,
  buildListFromIds,
  getCandidates,
  getPresets,
  getPreset,
  findIdByPath,
  findPathById,
  updateTheme
};
