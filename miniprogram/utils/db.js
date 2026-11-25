const config = require('./config.js');
const local = require('./storage/local.js');
const cloud = require('./storage/cloud.js');

let adapter = config.STORAGE_MODE === 'cloud' ? cloud : local;

const COLLECTIONS = config.COLLECTIONS;

function add(collection, record) {
  return adapter.add(collection, record);
}

function list(collection, sortBy) {
  return adapter.list(collection, sortBy);
}

// 按条件取全部记录。调用方（健康饮水/睡眠/运动列表）依赖此接口，
// 语义等价于 query，保留 getAll 作为兼容别名。
function getAll(collection, filter, sortBy) {
  return adapter.query(collection, filter, sortBy);
}

function query(collection, filter, sortBy) {
  return adapter.query(collection, filter, sortBy);
}

function getById(collection, id) {
  return adapter.getById(collection, id);
}

function update(collection, id, patch) {
  return adapter.update(collection, id, patch);
}

function remove(collection, id) {
  return adapter.remove(collection, id);
}

function count(collection, filter) {
  return adapter.count(collection, filter);
}

function page(collection, opts) {
  return adapter.page(collection, opts);
}

function switchMode(mode) {
  config.STORAGE_MODE = mode;
  adapter = mode === 'cloud' ? cloud : local;
  module.exports._adapter = adapter;
  if (mode === 'cloud') {
    try {
      const app = typeof getApp === 'function' ? getApp() : null;
      if (app && app.initCloud) app.initCloud();
    } catch (e) {
      console.error('cloud init on switch error:', e);
    }
  }
  return adapter;
}

function exportAll() {
  if (config.STORAGE_MODE !== 'local') {
    return Promise.reject(new Error('仅本地模式支持导出'));
  }
  const all = {};
  Object.values(COLLECTIONS).forEach(key => {
    all[key] = wx.getStorageSync(key) || [];
  });
  return Promise.resolve(all);
}

function importAll(data) {
  if (config.STORAGE_MODE !== 'local') {
    return Promise.reject(new Error('仅本地模式支持导入'));
  }
  Object.keys(data).forEach(key => {
    wx.setStorageSync(key, data[key]);
  });
  return Promise.resolve(true);
}

module.exports = {
  COLLECTIONS,
  add,
  list,
  getAll,
  query,
  getById,
  update,
  remove,
  count,
  page,
  switchMode,
  exportAll,
  importAll,
  get mode() { return config.STORAGE_MODE; }
};