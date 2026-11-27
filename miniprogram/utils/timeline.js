const db = require('./db.js');
const dateUtil = require('./date.js');
const diaryUtil = require('./diary.js');
const todoUtil = require('./todo.js');
const bookUtil = require('./book.js');

const MODULE_META = {
  accounting: { icon: 'wallet', label: '记账', color: '#F5A623' },
  diary:      { icon: 'note', label: '日记', color: '#9B59B6' },
  checkin:    { icon: 'check', label: '打卡', color: '#52C41A' },
  todo:       { icon: 'note', label: '待办', color: '#4A90D9' },
  anniversary:{ icon: 'celebrate', label: '纪念日', color: '#FF6B6B' },
  wishlist:   { icon: 'star', label: '愿望', color: '#1ABC9C' },
  movie:      { icon: 'movie', label: '观影', color: '#E74C3C' },
  reading:    { icon: 'book', label: '阅读', color: '#8E44AD' }
};

const MODULE_LIST = Object.keys(MODULE_META);

function extractDate(item, module) {
  if (!item) return 0;
  const biz = dateUtil.bizDateOf(item);
  if (biz) {
    const hours = { anniversary: 0, todo: 9, movie: 20, reading: 21 };
    const h = hours[module] === undefined ? 12 : hours[module];
    const ts = new Date(biz + 'T' + (h < 10 ? '0' + h : h) + ':00:00').getTime();
    if (ts > 0) return ts;
  }
  return item.createdAt || 0;
}

function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate();
}

function formatDayLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const todayKey = dayKey(now.getTime());
  const yest = new Date(now.getTime() - 86400000);
  const yestKey = dayKey(yest.getTime());
  const k = dayKey(ts);
  if (k === todayKey) return '今天';
  if (k === yestKey) return '昨天';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return month + '月' + day + '日 · ' + weekdays[d.getDay()];
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}

function decorateItem(item, module) {
  const meta = MODULE_META[module];
  const ts = extractDate(item, module);

  let title = '', subtitle = '', amount = '', extra = '';
  let targetPath = '';

  switch (module) {
    case 'accounting':
      title = item.category || '未分类';
      subtitle = item.note || '';
      amount = (item.type === 'expense' ? '-' : '+') + '¥' + (Number(item.amount) || 0).toFixed(2);
      extra = item.categoryIcon || item.parentCategoryIcon || 'wallet';
      targetPath = '/pages/accounting/edit/index?id=' + item._id;
      break;
    case 'diary':
      title = item.title || '无标题';
      subtitle = diaryUtil.getSummary(item.content, 60);
      amount = item.mood || 'note';
      extra = item.weather || '';
      targetPath = '/pages/diary/detail/index?id=' + item._id;
      break;
    case 'checkin':
      title = item.name || '习惯打卡';
      subtitle = '';
      amount = item.icon || 'check';
      extra = '';
      targetPath = '/pages/checkin/index/index';
      break;
    case 'todo':
      title = item.title || '';
      if (item.completed) amount = 'check';
      else if (item.overdue) amount = '';
      else amount = '';
      extra = item.priority || '';
      targetPath = '/pages/todo/detail/index?id=' + item._id;
      break;
    case 'anniversary':
      title = item.title || '纪念日';
      subtitle = item.date || '';
      amount = item.icon || 'celebrate';
      extra = item.color || '#FF6B6B';
      targetPath = '/pages/anniversary/detail/index?id=' + item._id;
      break;
    case 'wishlist':
      title = item.title || '';
      if (item.achieved) subtitle = '已实现';
      else if (item.targetDate) subtitle = item.targetDate;
      amount = item.icon || 'star';
      extra = '';
      targetPath = '/pages/wishlist/detail/index?id=' + item._id;
      break;
    case 'movie':
      title = item.title || '';
      subtitle = item.status === 'watched' ? '已看过' : (item.status === 'watching' ? '观看中' : '想看');
      if (item.rating > 0) subtitle += ' · 评分 ' + item.rating;
      amount = 'movie';
      extra = item.director ? '导演：' + item.director : '';
      targetPath = '/pages/movie/detail/index?id=' + item._id;
      break;
    case 'reading':
      title = item.title || '';
      subtitle = item.status === 'finished' ? '已读完' : (item.status === 'reading' ? '在读' : '想读');
      if (item.progress > 0 && item.status === 'reading') subtitle += ' · ' + item.progress + '%';
      if (item.rating > 0 && item.status === 'finished') subtitle += ' · 评分 ' + item.rating;
      amount = 'book';
      extra = item.author ? item.author : '';
      targetPath = '/pages/reading/detail/index?id=' + item._id;
      break;
  }

  return {
    _id: item._id,
    module,
    moduleIcon: meta.icon,
    moduleColor: meta.color,
    moduleLabel: meta.label,
    title,
    subtitle,
    amount,
    extra,
    ts,
    timeLabel: formatTime(ts),
    targetPath
  };
}

async function loadTimeline(filterModules) {
  const mods = filterModules && filterModules.length ? filterModules : MODULE_LIST;
  const promises = [];

  const acctFilter = { bookId: bookUtil.getCurrentBookId() };
  if (mods.indexOf('accounting') >= 0) promises.push(db.query(db.COLLECTIONS.ACCOUNTING, acctFilter));
  if (mods.indexOf('diary') >= 0) promises.push(db.list(db.COLLECTIONS.DIARY));
  if (mods.indexOf('checkin') >= 0) promises.push(db.list(db.COLLECTIONS.CHECKIN_RECORD));
  if (mods.indexOf('todo') >= 0) promises.push(db.list(db.COLLECTIONS.TODO));
  if (mods.indexOf('anniversary') >= 0) promises.push(db.list(db.COLLECTIONS.ANNIVERSARY));
  if (mods.indexOf('wishlist') >= 0) promises.push(db.list(db.COLLECTIONS.WISHLIST));
  if (mods.indexOf('movie') >= 0) promises.push(db.list(db.COLLECTIONS.MOVIE));
  if (mods.indexOf('reading') >= 0) promises.push(db.list(db.COLLECTIONS.READING));

  const results = await Promise.all(promises);

  let idx = 0;
  const raw = [];
  if (mods.indexOf('accounting') >= 0) { results[idx++].forEach(i => raw.push(decorateItem(i, 'accounting'))); }
  if (mods.indexOf('diary') >= 0) { results[idx++].forEach(i => raw.push(decorateItem(i, 'diary'))); }
  if (mods.indexOf('checkin') >= 0) { results[idx++].forEach(i => raw.push(decorateItem(i, 'checkin'))); }
  if (mods.indexOf('todo') >= 0) { results[idx++].forEach(i => {
    if (i.completed) raw.push(decorateItem(i, 'todo'));
  }); }
  if (mods.indexOf('anniversary') >= 0) { results[idx++].forEach(i => raw.push(decorateItem(i, 'anniversary'))); }
  if (mods.indexOf('wishlist') >= 0) { results[idx++].forEach(i => {
    if (i.achieved) raw.push(decorateItem(i, 'wishlist'));
  }); }
  if (mods.indexOf('movie') >= 0) { results[idx++].forEach(i => {
    if (i.status === 'watched') raw.push(decorateItem(i, 'movie'));
  }); }
  if (mods.indexOf('reading') >= 0) { results[idx++].forEach(i => {
    if (i.status === 'reading' || i.status === 'finished') raw.push(decorateItem(i, 'reading'));
  }); }

  raw.sort((a, b) => b.ts - a.ts);

  const groups = [];
  let lastKey = null;
  raw.forEach(item => {
    const k = dayKey(item.ts);
    if (k !== lastKey) {
      groups.push({
        dayKey: k,
        dayLabel: formatDayLabel(item.ts),
        items: []
      });
      lastKey = k;
    }
    groups[groups.length - 1].items.push(item);
  });

  return groups;
}

async function searchAll(keyword) {
  if (!keyword || !keyword.trim()) return [];
  const kw = keyword.trim().toLowerCase();
  const [acct, diary, todo, wish, movie, reading] = await Promise.all([
    db.query(db.COLLECTIONS.ACCOUNTING, { bookId: bookUtil.getCurrentBookId() }),
    db.list(db.COLLECTIONS.DIARY),
    db.list(db.COLLECTIONS.TODO),
    db.list(db.COLLECTIONS.WISHLIST),
    db.list(db.COLLECTIONS.MOVIE),
    db.list(db.COLLECTIONS.READING)
  ]);

  const results = [];
  function pushIf(items, module, fields) {
    items.forEach(i => {
      for (const f of fields) {
        const v = String(i[f] || '').toLowerCase();
        if (v.indexOf(kw) >= 0) {
          results.push(decorateItem(i, module));
          break;
        }
      }
    });
  }
  pushIf(acct, 'accounting', ['category', 'note', 'parentCategory']);
  pushIf(diary, 'diary', ['title', 'content', 'tags']);
  pushIf(todo, 'todo', ['title', 'note']);
  pushIf(wish, 'wishlist', ['title', 'note']);
  pushIf(movie, 'movie', ['title', 'director', 'actors', 'note']);
  pushIf(reading, 'reading', ['title', 'author', 'publisher', 'note']);

  results.sort((a, b) => b.ts - a.ts);
  return results;
}

module.exports = {
  MODULE_META,
  MODULE_LIST,
  loadTimeline,
  searchAll
};