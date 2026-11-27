const db = require('./db.js');
const bookUtil = require('./book.js');

const STORAGE_KEY_PREFIX = '__accounting_categories_';

const DEFAULT_CATEGORIES = [
  {
    _id: 'default_food',
    type: 'expense',
    name: '餐饮',
    icon: 'food',
    isDefault: true,
    children: [
      { _id: 'default_food_takeout', name: '外卖', icon: 'food' },
      { _id: 'default_food_dinein', name: '堂食', icon: 'food' },
      { _id: 'default_food_fruit', name: '水果', icon: 'food' },
      { _id: 'default_food_snack', name: '零食', icon: 'food' },
      { _id: 'default_food_drink', name: '饮品', icon: 'food' }
    ]
  },
  {
    _id: 'default_transport',
    type: 'expense',
    name: '交通',
    icon: 'transport',
    isDefault: true,
    children: [
      { _id: 'default_transport_bus', name: '公交地铁', icon: 'transport' },
      { _id: 'default_transport_taxi', name: '打车', icon: 'transport' },
      { _id: 'default_transport_fuel', name: '加油', icon: 'transport' },
      { _id: 'default_transport_train', name: '火车机票', icon: 'travel' }
    ]
  },
  {
    _id: 'default_shopping',
    type: 'expense',
    name: '购物',
    icon: 'shopping',
    isDefault: true,
    children: [
      { _id: 'default_shopping_clothes', name: '服饰', icon: 'shopping' },
      { _id: 'default_shopping_electronic', name: '数码', icon: 'shopping' },
      { _id: 'default_shopping_grocery', name: '日用百货', icon: 'shopping' },
      { _id: 'default_shopping_other', name: '其他', icon: 'shopping' }
    ]
  },
  {
    _id: 'default_entertainment',
    type: 'expense',
    name: '娱乐',
    icon: 'fun',
    isDefault: true,
    children: [
      { _id: 'default_entertainment_game', name: '游戏', icon: 'fun' },
      { _id: 'default_entertainment_movie', name: '电影演出', icon: 'movie' },
      { _id: 'default_entertainment_sport', name: '运动健身', icon: 'sport' },
      { _id: 'default_entertainment_travel', name: '旅行', icon: 'travel' }
    ]
  },
  {
    _id: 'default_housing',
    type: 'expense',
    name: '居家',
    icon: 'home',
    isDefault: true,
    children: [
      { _id: 'default_housing_rent', name: '房租', icon: 'home' },
      { _id: 'default_housing_utilities', name: '水电燃气', icon: 'idea' },
      { _id: 'default_housing_net', name: '网费话费', icon: 'wifi' },
      { _id: 'default_housing_repair', name: '维修', icon: 'repair' }
    ]
  },
  {
    _id: 'default_medical',
    type: 'expense',
    name: '医疗',
    icon: 'medicine',
    isDefault: true,
    children: [
      { _id: 'default_medical_hospital', name: '医院', icon: 'hospital' },
      { _id: 'default_medical_medicine', name: '药品', icon: 'medicine' },
      { _id: 'default_medical_checkup', name: '体检', icon: 'note' }
    ]
  },
  {
    _id: 'default_education',
    type: 'expense',
    name: '学习',
    icon: 'book',
    isDefault: true,
    children: [
      { _id: 'default_education_book', name: '书籍', icon: 'book' },
      { _id: 'default_education_course', name: '课程', icon: 'education' },
      { _id: 'default_education_tool', name: '学习用品', icon: 'edit' }
    ]
  },
  {
    _id: 'default_expense_other',
    type: 'expense',
    name: '其他',
    icon: 'pin',
    isDefault: true,
    children: [
      { _id: 'default_expense_other_default', name: '其他', icon: 'pin' }
    ]
  },
  {
    _id: 'default_salary',
    type: 'income',
    name: '工资',
    icon: 'wallet',
    isDefault: true,
    children: [
      { _id: 'default_salary_main', name: '基本工资', icon: 'wallet' },
      { _id: 'default_salary_bonus', name: '绩效奖金', icon: 'gift' }
    ]
  },
  {
    _id: 'default_investment',
    type: 'income',
    name: '理财',
    icon: 'chart',
    isDefault: true,
    children: [
      { _id: 'default_investment_interest', name: '利息', icon: 'wallet' },
      { _id: 'default_investment_stock', name: '股票基金', icon: 'chart' },
      { _id: 'default_investment_rental', name: '租金', icon: 'home' }
    ]
  },
  {
    _id: 'default_parttime',
    type: 'income',
    name: '兼职',
    icon: 'work',
    isDefault: true,
    children: [
      { _id: 'default_parttime_online', name: '线上兼职', icon: 'work' },
      { _id: 'default_parttime_offline', name: '线下兼职', icon: 'office' }
    ]
  },
  {
    _id: 'default_income_other',
    type: 'income',
    name: '其他',
    icon: 'pin',
    isDefault: true,
    children: [
      { _id: 'default_income_other_gift', name: '红包礼金', icon: 'gift' },
      { _id: 'default_income_other_refund', name: '退款返现', icon: 'card' },
      { _id: 'default_income_other_default', name: '其他', icon: 'pin' }
    ]
  }
];

function uid() {
  return 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function _storageKey(bookId) {
  return STORAGE_KEY_PREFIX + (bookId || bookUtil.getCurrentBookId() || 'default');
}

function loadCategories(bookId) {
  const key = _storageKey(bookId);
  try {
    const cached = wx.getStorageSync(key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (e) {}
  wx.setStorageSync(key, DEFAULT_CATEGORIES);
  return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
}

function saveCategories(list, bookId) {
  try {
    wx.setStorageSync(_storageKey(bookId), list);
  } catch (e) {}
}

function removeCategories(bookId) {
  try {
    wx.removeStorageSync(_storageKey(bookId));
  } catch (e) {}
}

function getCategoriesByType(type, bookId) {
  return loadCategories(bookId).filter(c => c.type === type);
}

function getChildById(childId, bookId) {
  const list = loadCategories(bookId);
  for (const parent of list) {
    for (const child of (parent.children || [])) {
      if (child._id === childId) {
        return { ...child, parentId: parent._id, parentName: parent.name, parentIcon: parent.icon, parentType: parent.type };
      }
    }
  }
  return null;
}

function getParentById(parentId, bookId) {
  const list = loadCategories(bookId);
  return list.find(c => c._id === parentId) || null;
}

function addParent(type, name, icon, bookId) {
  const list = loadCategories(bookId);
  const parent = {
    _id: uid(),
    type,
    name,
    icon: icon || 'folder',
    isDefault: false,
    children: [{ _id: uid(), name, icon: icon || 'folder' }]
  };
  list.push(parent);
  saveCategories(list, bookId);
  return parent;
}

function updateParent(parentId, patch, bookId) {
  const list = loadCategories(bookId);
  const idx = list.findIndex(c => c._id === parentId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    saveCategories(list, bookId);
    return list[idx];
  }
  return null;
}

function removeParent(parentId, bookId) {
  const list = loadCategories(bookId);
  const filtered = list.filter(c => c._id !== parentId);
  saveCategories(filtered, bookId);
}

function addChild(parentId, name, icon, bookId) {
  const list = loadCategories(bookId);
  const parent = list.find(c => c._id === parentId);
  if (parent) {
    const child = { _id: uid(), name, icon: icon || 'pin' };
    parent.children = parent.children || [];
    parent.children.push(child);
    saveCategories(list, bookId);
    return child;
  }
  return null;
}

function updateChild(parentId, childId, patch, bookId) {
  const list = loadCategories(bookId);
  const parent = list.find(c => c._id === parentId);
  if (parent) {
    const child = parent.children.find(c => c._id === childId);
    if (child) {
      Object.assign(child, patch);
      saveCategories(list, bookId);
      return child;
    }
  }
  return null;
}

function removeChild(parentId, childId, bookId) {
  const list = loadCategories(bookId);
  const parent = list.find(c => c._id === parentId);
  if (parent && parent.children && parent.children.length > 1) {
    parent.children = parent.children.filter(c => c._id !== childId);
    saveCategories(list, bookId);
    return true;
  }
  return false;
}

function resetCategories(bookId) {
  wx.removeStorageSync(_storageKey(bookId));
  return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
}

function buildCategoryMap(bookId) {
  const map = {};
  loadCategories(bookId).forEach(parent => {
    (parent.children || []).forEach(child => {
      map[child._id] = {
        ...child,
        parentId: parent._id,
        parentName: parent.name,
        parentIcon: parent.icon,
        parentType: parent.type
      };
    });
  });
  return map;
}

module.exports = {
  STORAGE_KEY_PREFIX,
  DEFAULT_CATEGORIES,
  loadCategories,
  saveCategories,
  removeCategories,
  getCategoriesByType,
  getChildById,
  getParentById,
  addParent,
  updateParent,
  removeParent,
  addChild,
  updateChild,
  removeChild,
  resetCategories,
  buildCategoryMap
};