const db = require('./db.js');

const CATEGORIES = {
  travel: { label: '旅行', icon: 'travel', color: '#4A90D9' },
  study: { label: '学习', icon: 'book', color: '#9B59B6' },
  career: { label: '事业', icon: 'work', color: '#1ABC9C' },
  health: { label: '健康', icon: 'sport', color: '#52C41A' },
  life: { label: '生活', icon: 'home', color: '#FF9F43' },
  other: { label: '其他', icon: 'star', color: '#FF6B6B' }
};

const CATEGORY_LIST = Object.keys(CATEGORIES);

const ICONS = ['travel', 'book', 'work', 'sport', 'home', 'fun', 'food', 'coffee', 'plant', 'wallet', 'gift', 'star'];

function hexToRgba(hex, alpha) {
  const h = (hex || '#4A90D9').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substr(0, 2), 16);
  const g = parseInt(full.substr(2, 2), 16);
  const b = parseInt(full.substr(4, 2), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function getProgress(item) {
  if (!item) return 0;
  if (item.achieved) return 100;
  const p = Number(item.progress) || 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

function decorate(item) {
  const cat = CATEGORIES[item.category] || CATEGORIES.other;
  return Object.assign({}, item, {
    categoryLabel: cat.label,
    categoryColor: cat.color,
    categoryIcon: cat.icon,
    categorySoft: hexToRgba(cat.color, 0.1),
    categoryTile: hexToRgba(cat.color, 0.13),
    progress: getProgress(item)
  });
}

async function loadWishlist() {
  return await db.list(db.COLLECTIONS.WISHLIST, { key: 'createdAt', order: 'desc' });
}

async function toggleAchieved(item) {
  const achieved = !item.achieved;
  return await db.update(db.COLLECTIONS.WISHLIST, item._id, {
    achieved,
    achievedAt: achieved ? Date.now() : null,
    progress: achieved ? 100 : item.progress || 0
  });
}

module.exports = {
  CATEGORIES,
  CATEGORY_LIST,
  ICONS,
  hexToRgba,
  getProgress,
  loadWishlist,
  toggleAchieved,
  decorate
};