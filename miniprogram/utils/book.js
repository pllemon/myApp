const db = require('./db.js');

// 账本图标候选：直接用 FLAT 字典中文名（选择器 tone=flat 命中即彩色），
// 去掉了旧的空串、零宽连接符、变体符与语义重复项（wallet/card 同为银行卡、pets 重复）。
const BOOK_ICONS = ['银行卡', '工资', '房租', '网购', '旅游', '宠物', '游戏', '书店', '送礼', '电影', '健身', '咖啡', '鲜花', '理财', '手机'];

// 固定色板，不随主题切换；历史色值已全部保留并补充中文名
const BOOK_COLORS = require('./color-palette.js').COLOR_OPTIONS;

const STORAGE_KEY_CURRENT_BOOK = 'current_book_id';
const DEFAULT_BOOK = {
  name: '默认账本',
  icon: 'wallet',
  color: '#4A90D9',
  initialBalance: 0,
  note: ''
};

let _cachedBooks = null;
let _cachedCurrentId = null;

function genId() {
  return 'b_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function getCurrentBookId() {
  if (_cachedCurrentId) return _cachedCurrentId;
  try {
    const id = wx.getStorageSync(STORAGE_KEY_CURRENT_BOOK);
    if (id) {
      _cachedCurrentId = id;
      return id;
    }
  } catch (e) {}
  return null;
}

function setCurrentBookId(id) {
  _cachedCurrentId = id;
  try {
    wx.setStorageSync(STORAGE_KEY_CURRENT_BOOK, id);
  } catch (e) {}
}

async function ensureDefaultBook() {
  const books = await db.list(db.COLLECTIONS.ACCOUNTING_BOOK, { key: 'createdAt', order: 'asc' });
  if (books.length === 0) {
    const id = genId();
    await db.add(db.COLLECTIONS.ACCOUNTING_BOOK, Object.assign({}, DEFAULT_BOOK, {
      _id: id,
      createdAt: Date.now()
    }));
    setCurrentBookId(id);
    _cachedBooks = null;
    return id;
  }
  const curId = getCurrentBookId();
  const exists = books.find(b => b._id === curId);
  if (!exists) {
    setCurrentBookId(books[0]._id);
  }
  return getCurrentBookId();
}

async function getAllBooks() {
  if (_cachedBooks) return _cachedBooks;
  await ensureDefaultBook();
  const books = await db.list(db.COLLECTIONS.ACCOUNTING_BOOK, { key: 'createdAt', order: 'asc' });
  _cachedBooks = books;
  return books;
}

async function getCurrentBook() {
  await ensureDefaultBook();
  const books = await getAllBooks();
  const id = getCurrentBookId();
  return books.find(b => b._id === id) || books[0];
}

async function switchBook(id) {
  setCurrentBookId(id);
}

async function createBook(data) {
  await ensureDefaultBook();
  const id = genId();
  const book = Object.assign({}, DEFAULT_BOOK, data, {
    _id: id,
    createdAt: Date.now()
  });
  await db.add(db.COLLECTIONS.ACCOUNTING_BOOK, book);
  _cachedBooks = null;
  return book;
}

async function updateBook(id, patch) {
  await db.update(db.COLLECTIONS.ACCOUNTING_BOOK, id, patch);
  _cachedBooks = null;
}

async function deleteBook(id) {
  const books = await getAllBooks();
  if (books.length <= 1) {
    throw new Error('至少保留一个账本');
  }
  await db.remove(db.COLLECTIONS.ACCOUNTING_BOOK, id);
  _cachedBooks = null;

  const remain = books.filter(b => b._id !== id);
  if (getCurrentBookId() === id) {
    setCurrentBookId(remain[0]._id);
  }

  const statsCache = require('./stats-cache.js');
  const records = await db.query(db.COLLECTIONS.ACCOUNTING, { bookId: id });
  for (const item of records) {
    await db.remove(db.COLLECTIONS.ACCOUNTING, item._id);
    statsCache.removeRecord(item);
  }

  // 分类实际存放在 wx storage 的 __accounting_categories_<bookId>，
  // 旧代码清的是恒为空的 ACCOUNTING_CATEGORY 集合，导致删账本后分类残留。
  const categoryUtil = require('./category.js');
  categoryUtil.removeCategories(id);

  const budgetUtil = require('./budget.js');
  await budgetUtil.removeBookBudgets(id);
}

function invalidate() {
  _cachedBooks = null;
}

function hexToRgba(hex, alpha) {
  const h = (hex || '#4A90D9').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.substr(0, 2), 16);
  const g = parseInt(full.substr(2, 2), 16);
  const b = parseInt(full.substr(4, 2), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

module.exports = {
  BOOK_ICONS,
  BOOK_COLORS,
  DEFAULT_BOOK,
  STORAGE_KEY_CURRENT_BOOK,
  getCurrentBookId,
  setCurrentBookId,
  ensureDefaultBook,
  getAllBooks,
  getCurrentBook,
  switchBook,
  createBook,
  updateBook,
  deleteBook,
  invalidate,
  hexToRgba
};