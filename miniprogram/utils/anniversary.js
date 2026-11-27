const db = require('./db.js');

const ICONS = ['celebrate', 'education', 'work', 'home', 'travel', 'user', 'love', 'flower', 'star', 'plant', 'gift', 'coffee', 'book'];

// 固定色板，不随主题切换；历史色值已全部保留
const COLORS = require('./color-palette.js').COLOR_VALUES;

const REPEAT = {
  annual: { label: '每年' },
  none: { label: '仅一次' }
};

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function hexToRgba(hex, alpha) {
  const h = (hex || '#4A90D9').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substr(0, 2), 16);
  const g = parseInt(full.substr(2, 2), 16);
  const b = parseInt(full.substr(4, 2), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function applyColor(item) {
  return Object.assign({}, item, {
    colorSoft: hexToRgba(item.color, 0.15),
    colorTranslucent: hexToRgba(item.color, 0.8)
  });
}

function parseDate(str) {
  return new Date(str + 'T00:00:00');
}

function toDateStr(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function daysBetween(aStr, bStr) {
  const a = parseDate(aStr).getTime();
  const b = parseDate(bStr).getTime();
  return Math.round((b - a) / 86400000);
}

function computeOccurrence(item, todayStr) {
  const d = parseDate(item.date);
  const today = parseDate(todayStr);
  let next;
  if (item.repeat === 'annual') {
    next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (next.getTime() < today.getTime()) {
      next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
    }
  } else {
    next = d;
  }
  const nextStr = toDateStr(next);
  const daysUntil = daysBetween(todayStr, nextStr);
  const years = item.repeat === 'annual' ? (next.getFullYear() - d.getFullYear()) : null;
  return { nextDate: nextStr, daysUntil, years };
}

function decorate(item, todayStr) {
  const occ = computeOccurrence(item, todayStr);
  let countdownLabel;
  if (occ.daysUntil < 0) countdownLabel = '已过 ' + Math.abs(occ.daysUntil) + ' 天';
  else if (occ.daysUntil === 0) countdownLabel = '就是今天';
  else countdownLabel = '还有 ' + occ.daysUntil + ' 天';
  let sub = item.date;
  if (item.repeat === 'annual' && occ.years) {
    sub = '第 ' + occ.years + ' 个 · ' + occ.nextDate.slice(5);
  }
  return applyColor(Object.assign({}, item, occ, { countdownLabel, sub }));
}

async function loadAnniversaries() {
  return await db.list(db.COLLECTIONS.ANNIVERSARY, { key: 'createdAt', order: 'desc' });
}

module.exports = {
  ICONS,
  COLORS,
  REPEAT,
  hexToRgba,
  loadAnniversaries,
  computeOccurrence,
  decorate
};