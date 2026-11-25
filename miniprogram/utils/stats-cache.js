// TODO: 后期切云模式时，将存储层从 wx.setStorageSync 替换为
//   db.collection('stats_summary')，实现统计跨设备同步。
//   业务侧所有调用 statsCache.xxx() 的代码无需改动。
//   同时需要处理：云端存全量 monthly key，设备首次启动拉取覆盖本地。

const STATS_KEY = '__stats_accounting';

function loadCache() {
  try {
    const raw = wx.getStorageSync(STATS_KEY);
    if (raw && raw.months) return raw;
  } catch (e) {}
  return { months: {}, total: { expense: 0, income: 0, count: 0 } };
}

function saveCache(cache) {
  wx.setStorageSync(STATS_KEY, cache);
}

function monthKey(year, month) {
  return year + '-' + (month < 10 ? '0' + month : month);
}

function mutateAmount(cache, type, amount, year, month, delta) {
  const key = monthKey(year, month);
  if (!cache.months[key]) {
    cache.months[key] = { expense: 0, income: 0, count: 0 };
  }
  const m = cache.months[key];
  if (type === 'expense') m.expense += delta * amount;
  if (type === 'income') m.income += delta * amount;
  m.count += delta;

  if (type === 'expense') cache.total.expense += delta * amount;
  if (type === 'income') cache.total.income += delta * amount;
  cache.total.count += delta;
}

function addRecord(record) {
  if (!record || (record.type !== 'expense' && record.type !== 'income')) return;
  const cache = loadCache();
  const d = new Date(record.createdAt);
  mutateAmount(cache, record.type, record.amount || 0, d.getFullYear(), d.getMonth() + 1, 1);
  saveCache(cache);
}

function removeRecord(record) {
  if (!record || (record.type !== 'expense' && record.type !== 'income')) return;
  const cache = loadCache();
  const d = new Date(record.createdAt);
  mutateAmount(cache, record.type, record.amount || 0, d.getFullYear(), d.getMonth() + 1, -1);
  saveCache(cache);
}

function updateRecord(oldRecord, newRecord) {
  removeRecord(oldRecord);
  addRecord(newRecord);
}

function getStats() {
  return loadCache();
}

function rebuildFromRecords(records) {
  const cache = { months: {}, total: { expense: 0, income: 0, count: 0 } };
  (records || []).forEach(r => {
    if (r.type !== 'expense' && r.type !== 'income') return;
    const d = new Date(r.createdAt);
    mutateAmount(cache, r.type, r.amount || 0, d.getFullYear(), d.getMonth() + 1, 1);
  });
  saveCache(cache);
  return cache;
}

function getYearGroups() {
  const cache = loadCache();
  const yearMap = {};
  Object.keys(cache.months).forEach(key => {
    const [yearStr, monthStr] = key.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const m = cache.months[key];
    if (!yearMap[year]) yearMap[year] = { year, expense: 0, income: 0, months: {} };
    yearMap[year].expense += m.expense;
    yearMap[year].income += m.income;
    yearMap[year].months[month] = { month, expense: m.expense, income: m.income };
  });
  return Object.values(yearMap).sort((a, b) => b.year - a.year);
}

function clear() {
  wx.removeStorageSync(STATS_KEY);
}

module.exports = {
  addRecord,
  removeRecord,
  updateRecord,
  getStats,
  rebuildFromRecords,
  getYearGroups,
  clear
};