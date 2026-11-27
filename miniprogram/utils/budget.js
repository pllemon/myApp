// 预算数据层。仅提供存储与汇总 API，不含 UI；预算页面属于后续功能深度批次。
// 预算粒度：账本 × 月份 × 分类（categoryId 为空表示账本总预算）。
const db = require('./db.js');
const dateUtil = require('./date.js');

const WARN_RATIO = 0.8;

function normalizeMonth(month) {
  if (!month) return dateUtil.formatDate(Date.now(), 'YYYY-MM');
  return String(month).slice(0, 7);
}

function budgetId(bookId, month, categoryId) {
  return bookId + '_' + month + '_' + (categoryId || 'all');
}

async function saveBudget(data) {
  const bookId = data.bookId || '';
  const month = normalizeMonth(data.month);
  const categoryId = data.categoryId || '';
  const amount = Number(data.amount) || 0;
  const id = budgetId(bookId, month, categoryId);
  const record = {
    _id: id,
    bookId,
    month,
    categoryId,
    amount,
    updatedAt: Date.now()
  };
  const existing = await db.getById(db.COLLECTIONS.BUDGET, id);
  if (existing) {
    await db.update(db.COLLECTIONS.BUDGET, id, record);
  } else {
    record.createdAt = Date.now();
    await db.add(db.COLLECTIONS.BUDGET, record);
  }
  return record;
}

async function getBudget(bookId, month, categoryId) {
  const id = budgetId(bookId, normalizeMonth(month), categoryId);
  return db.getById(db.COLLECTIONS.BUDGET, id);
}

async function getBudgets(bookId, month) {
  const m = normalizeMonth(month);
  const all = await db.list(db.COLLECTIONS.BUDGET);
  return all.filter(b => b.bookId === bookId && b.month === m);
}

async function removeBudget(bookId, month, categoryId) {
  const id = budgetId(bookId, normalizeMonth(month), categoryId);
  return db.remove(db.COLLECTIONS.BUDGET, id);
}

async function removeBookBudgets(bookId) {
  const all = await db.list(db.COLLECTIONS.BUDGET);
  for (const item of all) {
    if (item.bookId === bookId) await db.remove(db.COLLECTIONS.BUDGET, item._id);
  }
}

// 按业务日期汇总支出；parentCategoryId 用于支持按一级分类设预算。
async function getMonthSpend(bookId, month) {
  const m = normalizeMonth(month);
  const records = await db.query(db.COLLECTIONS.ACCOUNTING, { bookId });
  const result = { total: 0, byCategory: {} };
  records.forEach(r => {
    if (r.type !== 'expense') return;
    if (dateUtil.bizMonthOf(r) !== m) return;
    const amount = Number(r.amount) || 0;
    result.total += amount;
    if (r.categoryId) result.byCategory[r.categoryId] = (result.byCategory[r.categoryId] || 0) + amount;
    if (r.parentCategoryId) result.byCategory[r.parentCategoryId] = (result.byCategory[r.parentCategoryId] || 0) + amount;
  });
  return result;
}

function buildStatusItem(categoryId, limit, spent) {
  const ratio = limit > 0 ? spent / limit : 0;
  return {
    categoryId,
    limit,
    spent,
    percent: Math.round(ratio * 100),
    exceeded: limit > 0 && spent > limit,
    warning: limit > 0 && ratio >= WARN_RATIO
  };
}

async function getStatus(bookId, month) {
  const [budgets, spend] = await Promise.all([
    getBudgets(bookId, month),
    getMonthSpend(bookId, month)
  ]);
  const items = budgets.map(b => buildStatusItem(
    b.categoryId || '',
    Number(b.amount) || 0,
    b.categoryId ? (spend.byCategory[b.categoryId] || 0) : spend.total
  ));
  return items.sort((a, b) => (a.categoryId ? 1 : 0) - (b.categoryId ? 1 : 0));
}

async function getWarnings(bookId, month) {
  const list = await getStatus(bookId, month);
  return list.filter(i => i.warning);
}

module.exports = {
  WARN_RATIO,
  budgetId,
  saveBudget,
  getBudget,
  getBudgets,
  removeBudget,
  removeBookBudgets,
  getMonthSpend,
  getStatus,
  getWarnings
};
