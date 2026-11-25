var STORAGE_KEY = '__local_user_key';
var cachedOpenId = null;

function init() {
  if (cachedOpenId) return cachedOpenId;
  var saved = wx.getStorageSync(STORAGE_KEY);
  if (saved) {
    cachedOpenId = saved;
    return cachedOpenId;
  }
  var generated = 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
  wx.setStorageSync(STORAGE_KEY, generated);
  cachedOpenId = generated;
  return cachedOpenId;
}

function getOpenId() {
  if (cachedOpenId) return cachedOpenId;
  return init();
}

function setOpenIdFromCloud(cloudOpenId) {
  cachedOpenId = cloudOpenId;
}

function reset() {
  cachedOpenId = null;
  wx.removeStorageSync(STORAGE_KEY);
}

module.exports = {
  init: init,
  getOpenId: getOpenId,
  setOpenIdFromCloud: setOpenIdFromCloud,
  reset: reset
};