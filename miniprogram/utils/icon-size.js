/**
 * 图标尺寸档位 —— 全局统一，与主题无关。
 * WXML 里 m-icon 的 size 只取这四档；96rpx 仅用于空态插画。
 * CSS 侧对应 app.wxss 的 --icon-sm/md/lg/xl/hero。
 */
const ICON_SIZE = {
  sm: 28,   // 标题内联、小标记
  md: 36,   // 列表行、表单行（默认）
  lg: 44,   // 卡片主图标、操作按钮
  xl: 56,   // Hero / 封面
  hero: 96  // 空态插画专用
};

// 旧尺寸值归一化到最近档位
const SIZE_MAP = {
  24: 28, 26: 28, 28: 28,
  30: 28, 32: 36, 34: 36, 36: 36,
  40: 44, 44: 44,
  48: 56, 56: 56,
  96: 96
};

function normalizeSize(size) {
  const n = Number(size);
  return SIZE_MAP[n] || ICON_SIZE.md;
}

module.exports = { ICON_SIZE, SIZE_MAP, normalizeSize };
