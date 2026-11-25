const db = require('./db.js');

const CATEGORIES = {
  literature:{ label: '文学',   icon: '📖', color: '#4A90D9' },
  history:   { label: '历史',   icon: '🏛️', color: '#8E44AD' },
  social:    { label: '社科',   icon: '🌐', color: '#16A085' },
  economy:   { label: '经济',   icon: '📈', color: '#2ECC71' },
  science:   { label: '科技',   icon: '🔬', color: '#3498DB' },
  psychology:{ label: '心理',   icon: '🧠', color: '#9B59B6' },
  education: { label: '教育',   icon: '🎓', color: '#F5A623' },
  art:       { label: '艺术',   icon: '🎨', color: '#FF6B81' },
  comic:     { label: '漫画',   icon: '🖼️', color: '#E67E22' },
  other:     { label: '其他',   icon: '✨', color: '#95A5A6' }
};

const CATEGORY_LIST = Object.keys(CATEGORIES);

const STATUS = {
  plan:    { label: '想读',   color: '#BDC3C7' },
  reading: { label: '在读',   color: '#F39C12' },
  finished:{ label: '已读完', color: '#27AE60' }
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
  const progress = calcProgress(item);
  return Object.assign({}, item, {
    categoryLabel: cat.label,
    categoryColor: cat.color,
    categoryIcon: cat.icon,
    categorySoft: hexToRgba(cat.color, 0.1),
    categoryTile: hexToRgba(cat.color, 0.13),
    statusLabel: st.label,
    statusColor: st.color,
    statusSoft: hexToRgba(st.color, 0.1),
    progress
  });
}

function calcProgress(item) {
  if (!item) return 0;
  if (item.status === 'finished') return 100;
  const p = Number(item.progress);
  if (p > 0) return Math.max(0, Math.min(100, Math.round(p)));
  if (item.currentPage && item.totalPages && item.totalPages > 0) {
    return Math.max(0, Math.min(100, Math.round(Number(item.currentPage) / Number(item.totalPages) * 100)));
  }
  return 0;
}

async function loadReadings() {
  return await db.list(db.COLLECTIONS.READING, { key: 'startDate', order: 'desc' });
}

async function toggleStatus(item) {
  const order = STATUS_LIST;
  const idx = order.indexOf(item.status);
  const next = order[(idx + 1) % order.length];
  const patch = { status: next };
  const today = new Date().toISOString().slice(0, 10);
  if (next === 'reading' && !item.startDate) {
    patch.startDate = today;
  }
  if (next === 'finished') {
    patch.finishDate = today;
    patch.progress = 100;
  }
  if (next === 'plan') {
    patch.startDate = null;
    patch.finishDate = null;
  }
  return await db.update(db.COLLECTIONS.READING, item._id, patch);
}

function calcStats(list) {
  const total = list.length;
  const finished = list.filter(i => i.status === 'finished').length;
  const reading = list.filter(i => i.status === 'reading').length;
  const plan = list.filter(i => i.status === 'plan').length;
  const rated = list.filter(i => i.status === 'finished' && i.rating > 0);
  const avgRating = rated.length > 0
    ? rated.reduce((s, i) => s + (Number(i.rating) || 0), 0) / rated.length
    : 0;
  return { total, finished, reading, plan, avgRating: avgRating.toFixed(1) };
}

function formatPage(item) {
  if (!item) return '';
  if (item.totalPages) {
    return (item.currentPage || 0) + ' / ' + item.totalPages + ' 页';
  }
  const p = Number(item.progress);
  if (p > 0) return Math.round(p) + '%';
  return '';
}

module.exports = {
  CATEGORIES,
  CATEGORY_LIST,
  STATUS,
  STATUS_LIST,
  hexToRgba,
  decorate,
  calcProgress,
  loadReadings,
  toggleStatus,
  calcStats,
  formatPage
};