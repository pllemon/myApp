function pad(n) { return n < 10 ? '0' + n : '' + n; }

function formatDate(ts, fmt) {
  const d = new Date(ts);
  fmt = fmt || 'YYYY-MM-DD';
  return fmt
    .replace('YYYY', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}

function today() {
  return formatDate(Date.now(), 'YYYY-MM-DD');
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function todayEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function monthStart(year, month) {
  const d = new Date(year, month - 1, 1);
  return d.getTime();
}

function monthEnd(year, month) {
  const d = new Date(year, month, 0, 23, 59, 59, 999);
  return d.getTime();
}

function currentMonth() {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    label: `${d.getFullYear()}年${d.getMonth() + 1}月`
  };
}

function monthRange(year, month) {
  return {
    $gte: monthStart(year, month),
    $lte: monthEnd(year, month)
  };
}

function dayRange(dateStr) {
  const ts = new Date(dateStr + 'T00:00:00').getTime();
  return {
    $gte: ts,
    $lte: ts + 86400000 - 1
  };
}

function friendlyTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  return formatDate(ts, 'MM-DD');
}

module.exports = {
  pad,
  formatDate,
  today,
  todayStart,
  todayEnd,
  monthStart,
  monthEnd,
  currentMonth,
  monthRange,
  dayRange,
  friendlyTime
};