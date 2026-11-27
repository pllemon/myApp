// 规则版交叉洞察：只做描述性观察，不做因果推断，不构成建议。
// 所有日期口径统一走 bizDateOf，避免写入时间污染业务日期。
const db = require('./db.js');
const dateUtil = require('./date.js');
const checkinUtil = require('./checkin.js');

const POSITIVE_MOODS = ['happy', 'love', 'happy', 'calm'];
const NEGATIVE_MOODS = ['sad', 'sad', 'angry', 'anxious'];

function pad2(n) { return n < 10 ? '0' + n : String(n); }

function shiftDay(dayStr, delta) {
  const d = new Date(dayStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function avg(list) {
  if (!list.length) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

function item(icon, title, detail, sample, type) {
  return { icon, title, detail, sample, type: type || 'info' };
}

async function buildInsights() {
  const today = dateUtil.today();
  const recent = new Set();
  for (let i = 0; i < 30; i++) recent.add(shiftDay(today, -i));

  const [diaries, accountings, sleeps, todos, checkins, habits] = await Promise.all([
    db.list(db.COLLECTIONS.DIARY),
    db.list(db.COLLECTIONS.ACCOUNTING),
    db.list(db.COLLECTIONS.HEALTH_SLEEP),
    db.list(db.COLLECTIONS.TODO),
    checkinUtil.loadAllCheckinRecords(),
    db.list(db.COLLECTIONS.CHECKIN_HABIT)
  ]);

  const result = [];
  const inRange = (item) => recent.has(dateUtil.bizDateOf(item));

  // 规则 1：心情 × 当日支出
  const moodSpend = { positive: [], negative: [] };
  diaries.filter(d => inRange(d) && d.mood).forEach(d => {
    const day = dateUtil.bizDateOf(d);
    const spend = accountings
      .filter(a => dateUtil.bizDateOf(a) === day && a.type === 'expense')
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    if (POSITIVE_MOODS.includes(d.mood)) moodSpend.positive.push(spend);
    else if (NEGATIVE_MOODS.includes(d.mood)) moodSpend.negative.push(spend);
  });
  if (moodSpend.positive.length >= 5 && moodSpend.negative.length >= 5) {
    const pos = avg(moodSpend.positive);
    const neg = avg(moodSpend.negative);
    if (neg > 0) {
      const diff = Math.round((pos - neg) / neg * 100);
      if (Math.abs(diff) >= 20) {
        result.push(item('card', '心情与支出',
          `愉悦的日子平均支出 ¥${pos.toFixed(2)}，低落的日子 ¥${neg.toFixed(2)}，相差 ${Math.abs(diff)}%`,
          `正向 ${moodSpend.positive.length} 天 / 负向 ${moodSpend.negative} 天`,
          diff > 0 ? 'warning' : 'positive'));
      }
    }
  }

  // 规则 2：睡眠时长 × 次日待办完成率
  const sleepRates = { good: [], bad: [] };
  sleeps.filter(s => inRange(s)).forEach(s => {
    const hours = parseFloat(String(s.duration || ''));
    if (!hours || isNaN(hours)) return;
    const nextDay = shiftDay(dateUtil.bizDateOf(s), 1);
    const dayTodos = todos.filter(t => t.dueDate === nextDay);
    if (dayTodos.length < 2) return;
    const rate = dayTodos.filter(t => t.completed).length / dayTodos.length;
    if (hours >= 7) sleepRates.good.push(rate);
    else sleepRates.bad.push(rate);
  });
  if (sleepRates.good.length >= 3 && sleepRates.bad.length >= 3) {
    const good = avg(sleepRates.good);
    const bad = avg(sleepRates.bad);
    if (good - bad >= 0.15) {
      result.push(item('sleep', '睡眠与效率',
        `睡足 7 小时后，次日待办完成率 ${Math.round(good * 100)}%；不足 7 小时为 ${Math.round(bad * 100)}%`,
        `充足 ${sleepRates.good.length} 天 / 不足 ${sleepRates.bad.length} 天`,
        'positive'));
    }
  }

  // 规则 3：打卡节奏
  if (habits.length > 0 && checkins.length > 0) {
    const dates = [...new Set(checkins.map(r => r.date))].sort();
    const streaks = checkinUtil.calcStreaks(dates);
    if (streaks.current >= 3 && streaks.current >= streaks.longest * 0.8) {
      result.push(item('fire', '正在最佳节奏',
        `当前已连续打卡 ${streaks.current} 天，接近你的最长纪录 ${streaks.longest} 天`,
        `累计 ${checkins.length} 次打卡`, 'positive'));
    } else if (streaks.current === 0 && streaks.longest >= 5) {
      result.push(item('plant', '可以重新开始',
        `你曾连续打卡 ${streaks.longest} 天，目前连续天数归零`,
        '继续保持会有新的纪录', 'warning'));
    }
  }

  // 规则 4：记录密度
  const recordDays = new Set();
  [diaries, accountings, checkins, sleeps].forEach(list => {
    list.filter(inRange).forEach(x => recordDays.add(dateUtil.bizDateOf(x)));
  });
  if (recordDays.size >= 10) {
    const ratio = Math.round(recordDays.size / 30 * 100);
    result.push(item('calendar', '记录习惯',
      `近 30 天有 ${recordDays.size} 天留下了记录（${ratio}%）`,
      ratio >= 60 ? '习惯已经稳定' : '还可以更频繁一些',
      ratio >= 60 ? 'positive' : 'info'));
  }

  // 规则 5：支出集中度
  const monthKey = dateUtil.formatDate(Date.now(), 'YYYY-MM');
  const byCategory = {};
  let totalExpense = 0;
  accountings.filter(a => dateUtil.bizMonthOf(a) === monthKey && a.type === 'expense')
    .forEach(a => {
      const key = a.category || '其他';
      const amt = Number(a.amount) || 0;
      byCategory[key] = (byCategory[key] || 0) + amt;
      totalExpense += amt;
    });
  if (totalExpense > 0) {
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const share = Math.round(top[1] / totalExpense * 100);
    if (share >= 40) {
      result.push(item('chart', '支出集中',
        `本月「${top[0]}」占总支出的 ${share}%，合计 ¥${top[1].toFixed(2)}`,
        `本月总支出 ¥${totalExpense.toFixed(2)}`, 'info'));
    }
  }

  if (result.length === 0) {
    result.push(item('plant', '洞察还在生长',
      '再记录几天心情、支出和睡眠，就能看到它们之间的关联',
      '基于近 30 天数据', 'info'));
  }

  return result.slice(0, 5);
}

module.exports = { buildInsights };
