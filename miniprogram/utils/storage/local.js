const user = require('../user.js');
const dateUtil = require('../date.js');

// 排序取值：bizDate 统一走业务日期兜底（旧记录没有该字段时按 date/createdAt 回退）
function sortValue(item, key) {
  if (key === 'bizDate') return dateUtil.bizDateOf(item) || '';
  return item[key];
}

function compareItems(a, b, sortBy) {
  const av = sortValue(a, sortBy.key);
  const bv = sortValue(b, sortBy.key);
  if (typeof av === 'string' || typeof bv === 'string') {
    return sortBy.order === 'desc'
      ? String(bv || '').localeCompare(String(av || ''))
      : String(av || '').localeCompare(String(bv || ''));
  }
  return sortBy.order === 'desc' ? (bv || 0) - (av || 0) : (av || 0) - (bv || 0);
}

function genId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

function getCollection(key) {
  const data = wx.getStorageSync(key);
  return Array.isArray(data) ? data : [];
}

function saveCollection(key, list) {
  wx.setStorageSync(key, list);
}

function add(key, record) {
  const list = getCollection(key);
  const now = Date.now();
  const fullRecord = Object.assign({
    _id: genId(),
    _openid: user.getOpenId(),
    createdAt: now,
    updatedAt: now
  }, record);
  list.push(fullRecord);
  saveCollection(key, list);
  return Promise.resolve(fullRecord);
}

function applyFilter(items, filter) {
  const openId = user.getOpenId();
  let result = items.filter(item => item._openid === openId);

  if (filter) {
    result = result.filter(item => {
      for (const field in filter) {
        if (field === '_openid') continue;
        const expected = filter[field];
        if (typeof expected === 'object' && expected !== null) {
          if (expected.$gte !== undefined && item[field] < expected.$gte) return false;
          if (expected.$lte !== undefined && item[field] > expected.$lte) return false;
          if (expected.$eq !== undefined && item[field] !== expected.$eq) return false;
        } else {
          if (item[field] !== expected) return false;
        }
      }
      return true;
    });
  }
  return result;
}

function list(key, sortBy) {
  let result = applyFilter(getCollection(key), null);
  if (sortBy) result.sort((a, b) => compareItems(a, b, sortBy));
  return Promise.resolve(result);
}

function query(key, filter, sortBy) {
  let result = applyFilter(getCollection(key), filter);
  if (sortBy) result.sort((a, b) => compareItems(a, b, sortBy));
  return Promise.resolve(result);
}

function getById(key, id) {
  const openId = user.getOpenId();
  const list = getCollection(key);
  const found = list.find(item => item._id === id && item._openid === openId);
  return Promise.resolve(found || null);
}

function update(key, id, patch) {
  const openId = user.getOpenId();
  const list = getCollection(key);
  const idx = list.findIndex(item => item._id === id && item._openid === openId);
  if (idx === -1) return Promise.resolve(null);
  list[idx] = Object.assign({}, list[idx], patch, { updatedAt: Date.now() });
  saveCollection(key, list);
  return Promise.resolve(list[idx]);
}

function remove(key, id) {
  const openId = user.getOpenId();
  const list = getCollection(key);
  const filtered = list.filter(item => !(item._id === id && item._openid === openId));
  saveCollection(key, filtered);
  return Promise.resolve(filtered.length < list.length);
}

function count(key, filter) {
  return query(key, filter).then(list => list.length);
}

function page(key, opts = {}) {
  const { filter, sortBy, page = 1, pageSize = 50 } = opts;
  return query(key, filter, sortBy).then(all => {
    const start = (page - 1) * pageSize;
    const list = all.slice(start, start + pageSize);
    return { list, total: all.length, hasMore: start + pageSize < all.length };
  });
}

module.exports = {
  add,
  list,
  query,
  getById,
  update,
  remove,
  count,
  page
};