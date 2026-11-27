// 完整备份服务：集合数据 + 所有本地配置（__ 前缀 / 当前账本 / 番茄计数等）。
// 备份文件是纯 JSON，跨版本通过 version 字段兼容。
const APP_TAG = 'life-note-backup';
const BACKUP_VERSION = 1;
const FILE_NAME_PREFIX = '生活记备份_';

function pad2(n) { return n < 10 ? '0' + n : String(n); }

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

// 扫描全部本地 storage，不遗漏任何配置键。
function buildBackup() {
  let keys = [];
  try {
    const info = wx.getStorageInfoSync();
    keys = (info && info.keys) ? info.keys.slice() : [];
  } catch (e) {
    keys = [];
  }
  const data = {};
  keys.forEach(k => {
    try {
      const v = wx.getStorageSync(k);
      if (v !== '' && v !== null && v !== undefined) data[k] = v;
    } catch (e) {}
  });
  return {
    app: APP_TAG,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    itemCount: keys.length,
    data
  };
}

function validateBackup(backup) {
  if (!backup || typeof backup !== 'object') return { ok: false, reason: '文件格式无效' };
  if (backup.app !== APP_TAG) return { ok: false, reason: '这不是「生活记」的备份文件' };
  if (!backup.data || typeof backup.data !== 'object') return { ok: false, reason: '备份内容为空' };
  if (backup.version > BACKUP_VERSION) {
    return { ok: false, reason: '备份由更新版本创建，请升级小程序后再恢复' };
  }
  const keys = Object.keys(backup.data);
  if (keys.length === 0) return { ok: false, reason: '备份中没有数据' };
  return { ok: true, keys };
}

// 恢复策略：全量覆盖。执行前对当前数据做一次内存快照，写入失败可回滚。
function restoreBackup(backup) {
  const check = validateBackup(backup);
  if (!check.ok) throw new Error(check.reason);

  let currentKeys = [];
  try {
    const info = wx.getStorageInfoSync();
    currentKeys = (info && info.keys) ? info.keys.slice() : [];
  } catch (e) {}
  const snapshot = {};
  currentKeys.forEach(k => {
    try { snapshot[k] = wx.getStorageSync(k); } catch (e) {}
  });

  try {
    currentKeys.forEach(k => {
      try { wx.removeStorageSync(k); } catch (e) {}
    });
    Object.keys(backup.data).forEach(k => {
      wx.setStorageSync(k, backup.data[k]);
    });
  } catch (e) {
    // 回滚：清掉残留后写回快照
    try {
      const after = wx.getStorageInfoSync().keys || [];
      after.forEach(k => wx.removeStorageSync(k));
      Object.keys(snapshot).forEach(k => wx.setStorageSync(k, snapshot[k]));
    } catch (ignore) {}
    throw new Error('恢复失败，已尝试回滚原有数据');
  }
  return check.keys.length;
}

// 导出到文件并通过微信会话保存（用户主动触发分享）。
function exportToFile() {
  const backup = buildBackup();
  const json = JSON.stringify(backup);
  const filePath = `${wx.env.USER_DATA_PATH}/${FILE_NAME_PREFIX}${stamp()}.json`;
  try {
    wx.getFileSystemManager().writeFileSync(filePath, json, 'utf8');
  } catch (e) {
    throw new Error('写入备份文件失败');
  }
  return new Promise((resolve, reject) => {
    if (!wx.shareFileMessage) {
      reject(new Error('当前微信版本不支持文件分享，请使用剪贴板导出'));
      return;
    }
    wx.shareFileMessage({
      filePath,
      fileName: `${FILE_NAME_PREFIX}${stamp()}.json`,
      success: () => resolve({ path: filePath, count: backup.itemCount }),
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') >= 0) {
          resolve({ path: filePath, count: backup.itemCount, canceled: true });
        } else {
          reject(new Error('文件分享失败，可重试或使用剪贴板导出'));
        }
      }
    });
  });
}

// 从微信会话选择备份文件并读取。
function pickAndReadFile() {
  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) { reject(new Error('未选择文件')); return; }
        try {
          const content = wx.getFileSystemManager().readFileSync(file.path, 'utf8');
          const backup = JSON.parse(content);
          const check = validateBackup(backup);
          if (!check.ok) { reject(new Error(check.reason)); return; }
          resolve({ backup, keys: check.keys });
        } catch (e) {
          reject(new Error('备份文件解析失败，请确认文件未被修改'));
        }
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') >= 0) resolve(null);
        else reject(new Error('选择文件失败'));
      }
    });
  });
}

module.exports = {
  APP_TAG,
  BACKUP_VERSION,
  buildBackup,
  validateBackup,
  restoreBackup,
  exportToFile,
  pickAndReadFile
};
