const db = require('./db.js');
const dateUtil = require('./date.js');

const CATEGORIES = {
  drama:    { label: '剧情',   icon: 'movie', color: '#4A90D9' },
  comedy:   { label: '喜剧',   icon: 'happy', color: '#F5A623' },
  action:   { label: '动作',   icon: 'flash', color: '#E74C3C' },
  romance:  { label: '爱情',   icon: 'love', color: '#FF6B81' },
  scifi:    { label: '科幻',   icon: 'travel', color: '#9B59B6' },
  animation:{ label: '动画',   icon: 'fun', color: '#2ECC71' },
  doc:      { label: '纪录片', icon: 'globe', color: '#1ABC9C' },
  suspense: { label: '悬疑',   icon: 'search', color: '#8E44AD' },
  horror:   { label: '恐怖',   icon: 'ghost', color: '#34495E' },
  other:    { label: '其他',   icon: 'star', color: '#95A5A6' }
};

const CATEGORY_LIST = Object.keys(CATEGORIES);

const STATUS = {
  plan:    { label: '想看',   color: '#BDC3C7' },
  watching:{ label: '观看中', color: '#F39C12' },
  watched: { label: '已看过', color: '#27AE60' }
};

const STATUS_LIST = Object.keys(STATUS);

function hexToRgba(hex, alpha) {
  const h = (hex || '#4A90D9').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substr(0, 2), 16);
  const g = parseInt(full.substr(2, 2), 16);
  const b = parseInt(full.substr(4, 2), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function decorate(item) {
  const cat = CATEGORIES[item.category] || CATEGORIES.other;
  const st = STATUS[item.status] || STATUS.plan;
  return Object.assign({}, item, {
    categoryLabel: cat.label,
    categoryColor: cat.color,
    categoryIcon: cat.icon,
    categorySoft: hexToRgba(cat.color, 0.1),
    categoryTile: hexToRgba(cat.color, 0.13),
    statusLabel: st.label,
    statusColor: st.color,
    statusSoft: hexToRgba(st.color, 0.1)
  });
}

async function loadMovies() {
  return await db.list(db.COLLECTIONS.MOVIE, { key: 'watchedDate', order: 'desc' });
}

async function toggleStatus(item) {
  const order = STATUS_LIST;
  const idx = order.indexOf(item.status);
  const next = order[(idx + 1) % order.length];
  const patch = { status: next };
  if (next === 'watched' && !item.watchedDate) {
    patch.watchedDate = dateUtil.today();
  }
  if (next === 'plan') {
    patch.watchedDate = null;
  }
  return await db.update(db.COLLECTIONS.MOVIE, item._id, patch);
}

function calcStats(list) {
  const total = list.length;
  const watched = list.filter(i => i.status === 'watched').length;
  const watching = list.filter(i => i.status === 'watching').length;
  const plan = list.filter(i => i.status === 'plan').length;
  const rated = list.filter(i => i.status === 'watched' && i.rating > 0);
  const avgRating = rated.length > 0
    ? rated.reduce((s, i) => s + (Number(i.rating) || 0), 0) / rated.length
    : 0;
  return { total, watched, watching, plan, avgRating: avgRating.toFixed(1) };
}

function formatYear(val) {
  if (!val) return '';
  const y = Number(val);
  if (!y || y < 1900 || y > 2100) return '';
  return String(y);
}

function formatDuration(val) {
  const m = Number(val);
  if (!m || m <= 0) return '';
  if (m < 60) return m + '分钟';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? h + 'h' + min + 'min' : h + 'h';
}

module.exports = {
  CATEGORIES,
  CATEGORY_LIST,
  STATUS,
  STATUS_LIST,
  hexToRgba,
  decorate,
  loadMovies,
  toggleStatus,
  calcStats,
  formatYear,
  formatDuration
};