/**
 * 统一交互工具层
 * 依据《交互规范与重构基线 v1.0》，全项目共用，禁止页面自定义同类逻辑。
 */

const DELETE_TITLE = '确认删除';
const DELETE_CONTENT = '删除后不可恢复';
const DELETE_CONFIRM = '删除';

function toast(msg, type) {
  wx.showToast({
    title: msg || '已保存',
    icon: type === 'none' ? 'none' : (type === 'error' ? 'none' : 'success')
  });
}

/**
 * 统一删除确认
 * @returns Promise<boolean>
 */
function confirmDelete(options) {
  const o = options || {};
  return new Promise(resolve => {
    wx.showModal({
      title: o.title || DELETE_TITLE,
      content: o.content || DELETE_CONTENT,
      confirmText: o.confirmText || DELETE_CONFIRM,
      confirmColor: '#FF4D4F',
      cancelText: '取消',
      success: res => resolve(!!res.confirm),
      fail: () => resolve(false)
    });
  });
}

/**
 * 删除确认（旧代码兼容形态）
 * 返回形如 { confirm: boolean }，便于直接替换 `await wx.showModal(...)` 调用，
 * 页面原有的 `if (!res.confirm) return` 无需改动。
 * @returns Promise<{confirm: boolean}>
 */
async function confirmDeleteLegacy(options) {
  const ok = await confirmDelete(options);
  return { confirm: ok };
}

/**
 * 删除确认（回调式旧代码兼容）
 * 用于替换 `wx.showModal({ ..., success: async res => {...} })` 的外壳，
 * 保留页面原有 success 回调逻辑不变。
 */
function confirmDeleteWith(options, success) {
  confirmDelete(options).then(ok => success({ confirm: ok }));
}

/**
 * 通用确认（回调式旧代码兼容）
 */
function confirmActionWith(options, success) {
  confirmAction(options).then(ok => success({ confirm: ok }));
}

/**
 * 通用二次确认（非删除场景，如恢复默认、清空）
 */
function confirmAction(options) {
  const o = options || {};
  return new Promise(resolve => {
    wx.showModal({
      title: o.title || '确认操作',
      content: o.content || '确定继续吗？',
      confirmText: o.confirmText || '确定',
      cancelText: '取消',
      success: res => resolve(!!res.confirm),
      fail: () => resolve(false)
    });
  });
}

/**
 * 统一输入弹窗（轻量编辑）
 * @returns Promise<string|null> 确认且通过校验返回内容，取消返回 null
 */
function promptInput(options) {
  const o = options || {};
  return new Promise(resolve => {
    wx.showModal({
      title: o.title || '请输入',
      content: o.value || '',
      editable: true,
      placeholderText: o.placeholder || '',
      confirmText: o.confirmText || '保存',
      success: res => {
        if (!res.confirm) return resolve(null);
        const value = (res.content || '').trim();
        if (o.required && !value) {
          toast(o.emptyTip || '请输入内容', 'none');
          return resolve(null);
        }
        if (o.validator && !o.validator(value)) {
          toast(o.invalidTip || '输入内容不合法', 'none');
          return resolve(null);
        }
        resolve(value);
      },
      fail: () => resolve(null)
    });
  });
}

/**
 * 长按操作菜单：编辑 / 删除
 * @returns Promise<'edit'|'delete'|null>
 */
function showItemActions(options) {
  const o = options || {};
  const items = o.items || ['编辑', '删除'];
  const values = o.values || ['edit', 'delete'];
  return new Promise(resolve => {
    wx.showActionSheet({
      itemList: items,
      success: res => resolve(values[res.tapIndex] || null),
      fail: () => resolve(null)
    });
  });
}

/**
 * 保存成功反馈并返回
 */
function saveAndBack(msg) {
  toast(msg || '已保存');
  setTimeout(() => wx.navigateBack(), 500);
}

module.exports = {
  toast,
  confirmDelete,
  confirmDeleteLegacy,
  confirmDeleteWith,
  confirmAction,
  confirmActionWith,
  promptInput,
  showItemActions,
  saveAndBack
};
