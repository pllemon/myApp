const db = require('./db.js');

const BOOK_ICONS = ['💰','💳','🏦','💼','🏠','🚗','🎒','👨‍👩‍👧','🐱','🐶','🎮','📚','✈️','🎁','🛒'];

const BOOK_COLORS = [
  { label: '天蓝', value: '#4A90D9' },
  { label: '橙色', value: '#F5A623' },
  { label: '翠绿', value: '#27AE60' },
  { label: '玫红', value: '#E74C3C' },
  { label: '紫色', value: '#8E44AD' },
  { label: '青色', value: '#1ABC9C' },
  { label: '深灰', value: '#34495E' },
  { label: '粉色', value: '#FF6B81' }
];

const STORAGE_KEY_CURRENT_BOOK = 'current_book_id';
const DEFAULT_BOOK = {
  name: '默认账本',
  icon: '💰',
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

  const allColls = [
    db.COLLECTIONS.ACCOUNTING,
    db.COLLECTIONS.ACCOUNTING_CATEGORY
  ];
  for (const coll of allColls) {
    const list = await db.query(coll, { bookId: id });
    for (const item of list) {
      await db.remove(coll, item._id);
    }
  }
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