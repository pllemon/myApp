const STORAGE_KEY = '__tabbar_config';
const SELECTED_KEY = '__tabbar_selected';
const SHORTCUT_KEY = '__shortcut_selected';
const CONFIG_VERSION = 6;

const CANDIDATES = [
  { id: 'home',      pagePath: '/pages/home/index/index',      text: '首页', icon: '🏠', fixed: true },
  { id: 'diary',     pagePath: '/pages/diary/index/index',     text: '日记', icon: '📝', fixed: false },
  { id: 'accounting',pagePath: '/pages/accounting/index/index',text: '记账', icon: '💰', fixed: false },
  { id: 'health',    pagePath: '/pages/health/index/index',    text: '健康', icon: '💪', fixed: false },
  { id: 'checkin',   pagePath: '/pages/checkin/index/index',   text: '打卡', icon: '✅', fixed: false },
  { id: 'todo',      pagePath: '/pages/todo/index/index',      text: '待办', icon: '📋', fixed: false },
  { id: 'stats',     pagePath: '/pages/stats/index/index',     text: '统计', icon: '📊', fixed: false },
  { id: 'profile',   pagePath: '/pages/profile/index/index',   text: '我的', icon: '👤', fixed: true }
];

const SHORTCUT_CANDIDATES = [
  { id: 'calendar',    pagePath: '/pages/calendar/index/index',    text: '日历',   icon: '📅' },
  { id: 'timeline',    pagePath: '/pages/timeline/index/index',    text: '时间线', icon: '⏳' },
  { id: 'anniversary', pagePath: '/pages/anniversary/index/index', text: '纪念日', icon: '🎈' },
  { id: 'wishlist',    pagePath: '/pages/wishlist/index/index',    text: '愿望清单', icon: '🌟' },
  { id: 'reading',     pagePath: '/pages/reading/index/index',     text: '阅读',   icon: '📚' },
  { id: 'movie',       pagePath: '/pages/movie/index/index',       text: '观影',   icon: '🎬' }
];

const PRESETS = [
  { id: 'default', name: '默认', defaultIds: ['home', 'diary', 'accounting', 'health', 'profile'] }
];

const COLORS = {
  color: '#999999',
  selectedColor: '#333333',
  backgroundColor: '#FFFFFF',
  borderColor: '#eeeeee',
  borderStyle: 'black'
};

function loadConfig() {
  loadThemeColors();
  const validIds = getSelectedIds().filter(id => CANDIDATES.find(x => x.id === id));
  const ids = validIds.length > 0 ? validIds : PRESETS[0].defaultIds;
  const list = buildListFromIds(ids);
  return {
    list,
    color: COLORS.color,
    selectedColor: COLORS.selectedColor,
    backgroundColor: COLORS.backgroundColor,
    borderStyle: COLORS.borderStyle,
    bgColor: COLORS.backgroundColor,
    borderColor: COLORS.borderColor
  };
}

function buildListFromIds(ids) {
  return ids.map(id => {
    const c = CANDIDATES.find(x => x.id === id);
    if (!c) return null;
    return {
      id: c.id,
      pagePath: c.pagePath,
      text: c.text,
      icon: c.icon,
      iconPath: `images/tabbar/${c.id}.png`,
      selectedIconPath: `images/tabbar/${c.id}_active.png`,
      fixed: c.fixed,
      showDot: false,
      selected: false
    };
  }).filter(Boolean);
}

function updateBadge(pagePath, count, showDot) {
}

function saveConfig(config) {
  try {
    wx.setStorageSync(STORAGE_KEY, config);
  } catch (e) {}
}

// 主题切换时由设置页调用，写入配色并持久化；loadConfig 会读取并覆盖默认 COLORS。
// 设置页传 bgColor，COLORS 内部字段名为 backgroundColor，这里做兼容映射。
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

function loadThemeColors() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY);
    if (saved && saved.colors && typeof saved.colors === 'object') {
      Object.keys(saved.colors).forEach(k => {
        if (k in COLORS && typeof saved.colors[k] === 'string') COLORS[k] = saved.colors[k];
      });
    }
  } catch (e) {}
}

function getSelectedIds() {
  try {
    const ids = wx.getStorageSync(SELECTED_KEY);
    if (Array.isArray(ids) && ids.length > 0) return ids;
  } catch (e) {}
  return PRESETS[0].defaultIds.slice();
}

function setSelectedIds(ids) {
  try {
    wx.setStorageSync(SELECTED_KEY, ids);
  } catch (e) {}
}

function loadShortcutIds() {
  try {
    const ids = wx.getStorageSync(SHORTCUT_KEY);
    if (Array.isArray(ids)) return ids;
  } catch (e) {}
  return SHORTCUT_CANDIDATES.map(c => c.id);
}

function saveShortcutIds(ids) {
  try {
    wx.setStorageSync(SHORTCUT_KEY, ids);
  } catch (e) {}
}

function getShortcutConfig() {
  return SHORTCUT_CANDIDATES;
}

function getCandidates() {
  return CANDIDATES;
}

function getPresets() {
  return PRESETS;
}

function getPreset(id) {
  return PRESETS.find(p => p.id === id);
}

function findIdByPath(path) {
  const c = CANDIDATES.find(x => x.pagePath === path);
  return c ? c.id : null;
}

function findPathById(id) {
  const c = CANDIDATES.find(x => x.id === id);
  return c ? c.pagePath : null;
}

module.exports = {
  STORAGE_KEY,
  SELECTED_KEY,
  SHORTCUT_KEY,
  CONFIG_VERSION,
  MIN_COUNT: 3,
  MAX_COUNT: 5,
  MIDDLE_MIN: 1,
  MIDDLE_MAX: 3,
  CANDIDATES,
  SHORTCUT_CANDIDATES,
  loadConfig,
  saveConfig,
  getSelectedIds,
  setSelectedIds,
  loadShortcutIds,
  saveShortcutIds,
  getShortcutConfig,
  getCandidates,
  getPresets,
  getPreset,
  findIdByPath,
  findPathById,
  buildListFromIds,
  updateBadge,
  updateTheme
};