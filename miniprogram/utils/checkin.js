const db = require('./db.js');
const dateUtil = require('./date.js');

const HABIT_PRESETS = [
  { name: '早起', icon: 'sun', color: '#F5A623' },
  { name: '早睡', icon: 'moon', color: '#9B59B6' },
  { name: '喝水', icon: 'health', color: '#4A90D9' },
  { name: '运动', icon: 'sport', color: '#2ECC71' },
  { name: '阅读', icon: 'book', color: '#E67E22' },
  { name: '冥想', icon: 'meditate', color: '#1ABC9C' },
  { name: '写日记', icon: 'edit', color: '#9B59B6' },
  { name: '学习', icon: 'book', color: '#3498DB' },
  { name: '戒糖', icon: 'ban', color: '#E74C3C' },
  { name: '拉伸', icon: 'sport', color: '#16A085' },
  { name: '记账', icon: 'wallet', color: '#F39C12' },
  { name: '打卡学习', icon: 'target', color: '#34495E' }
];

const ICON_OPTIONS = [
  'sun', 'moon', 'sport', 'book', 'meditate', 'edit',
  'target', 'transport', 'work', 'fun', 'food',
  'ban', 'coffee', 'plant', 'trophy', 'idea', 'star', 'fire', 'diamond'
];

// 固定色板，不随主题切换；历史色值已全部保留
const COLOR_OPTIONS = require('./color-palette.js').COLOR_VALUES;

function getDaysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00').getTime();
  const d2 = new Date(dateStr2 + 'T00:00:00').getTime();
  return Math.round(Math.abs(d2 - d1) / 86400000);
}

function calcStreaks(checkinDates) {
  if (!checkinDates || checkinDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sorted = checkinDates.slice().sort().reverse();
  const today = dateUtil.today();
  const yesterday = dateUtil.formatDate(Date.now() - 86400000, 'YYYY-MM-DD');

  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const gap = getDaysBetween(sorted[i - 1], sorted[i]);
      if (gap === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  let longest = 1;
  let temp = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = getDaysBetween(sorted[i], sorted[i + 1]);
    if (gap === 1) {
      temp++;
      longest = Math.max(longest, temp);
    } else {
      temp = 1;
    }
  }

  return { current, longest };
}

async function loadHabits() {
  const habits = await db.list(db.COLLECTIONS.CHECKIN_HABIT, { key: 'sortOrder', order: 'asc' });
  return habits;
}

async function loadHabitCheckinDates(habitId) {
  const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, { habitId });
  const dates = records.map(r => r.date);
  return [...new Set(dates)].sort();
}

async function loadAllCheckinRecords() {
  return await db.list(db.COLLECTIONS.CHECKIN_RECORD);
}

async function checkin(habitId, habitName, dateStr, images) {
  const exists = await db.query(db.COLLECTIONS.CHECKIN_RECORD, {
    habitId,
    date: dateStr
  });
  if (exists.length > 0) {
    return exists[0];
  }
  const record = {
    habitId,
    habitName,
    date: dateStr
  };
  if (images && images.length > 0) record.images = images;
  return await db.add(db.COLLECTIONS.CHECKIN_RECORD, record);
}

async function uncheckin(habitId, dateStr) {
  const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, {
    habitId,
    date: dateStr
  });
  const imageUtil = require('./image.js');
  records.forEach(r => {
    if (r.images) imageUtil.cleanAllImages(r.images);
  });
  const tasks = records.map(r => db.remove(db.COLLECTIONS.CHECKIN_RECORD, r._id));
  await Promise.all(tasks);
  return records.length;
}

async function hasChecked(habitId, dateStr) {
  const records = await db.query(db.COLLECTIONS.CHECKIN_RECORD, {
    habitId,
    date: dateStr
  });
  return records.length > 0;
}

function getTodayStats(habits, records) {
  const today = dateUtil.today();
  const todayRecords = records.filter(r => r.date === today);
  const checkedHabitIds = new Set(todayRecords.map(r => r.habitId));
  return {
    total: habits.length,
    checked: checkedHabitIds.size,
    checkedIds: checkedHabitIds
  };
}

function buildMonthCalendar(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = dateUtil.formatDate(new Date(year, month - 1, d).getTime(), 'YYYY-MM-DD');
    cells.push({ day: d, date: dateStr });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ empty: true });
  }
  return cells;
}

function buildYearHeatmap(year, records) {
  const recordsByDate = {};
  records.forEach(r => {
    recordsByDate[r.date] = (recordsByDate[r.date] || 0) + 1;
  });

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    const cells = [];
    for (let d = 1; d <= 31; d++) {
      if (d > daysInMonth) {
        cells.push(null);
      } else {
        const dateStr = dateUtil.formatDate(new Date(year, m - 1, d).getTime(), 'YYYY-MM-DD');
        cells.push({ date: dateStr, count: recordsByDate[dateStr] || 0, day: d });
      }
    }
    months.push({ label: m + '月', cells });
  }

  return months;
}

module.exports = {
  HABIT_PRESETS,
  ICON_OPTIONS,
  COLOR_OPTIONS,
  calcStreaks,
  loadHabits,
  loadHabitCheckinDates,
  loadAllCheckinRecords,
  checkin,
  uncheckin,
  hasChecked,
  getTodayStats,
  buildMonthCalendar,
  buildYearHeatmap
};