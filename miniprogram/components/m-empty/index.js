// 固定空态图标：冷浅灰空纸盒（四片翻开盖口 + 梯形盒身）。
// 造型与配色统一，不随模块 / 主题变化，全系统空态共用这一枚。
// base64 内容 = <svg viewBox="-32 -32 64 64">…空纸盒…</svg>
const EMPTY_ICON_SRC = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0zMiAtMzIgNjQgNjQiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjI5IiBmaWxsPSIjRjJGNEY4Ii8+PGVsbGlwc2UgY3g9IjAiIGN5PSIxOSIgcng9IjIxIiByeT0iNSIgZmlsbD0iI0U0RThFRiIvPjxwb2x5Z29uIHBvaW50cz0iLTE2LC03IDE2LC03IDIxLC0yMCAtMjEsLTIwIiBmaWxsPSIjRTJFN0YwIi8+PHBvbHlnb24gcG9pbnRzPSItMTYsLTcgMTYsLTcgMjEsMyAtMjEsMyIgZmlsbD0iI0I5QzNEMiIvPjxwb2x5Z29uIHBvaW50cz0iLTE2LC03IC0yMSwzIC0zMCwtMiAtMjUsLTEyIiBmaWxsPSIjRDNEQUU2Ii8+PHBvbHlnb24gcG9pbnRzPSIxNiwtNyAyMSwzIDMwLC0yIDI1LC0xMiIgZmlsbD0iI0QzREFFNiIvPjxwb2x5Z29uIHBvaW50cz0iLTIxLDMgMjEsMyAxOCwyMCAtMTgsMjAiIGZpbGw9IiNDREQ1RTEiLz48cG9seWdvbiBwb2ludHM9IjEyLDMgMjEsMyAxOCwyMCAxMCwyMCIgZmlsbD0iI0I0QkVDQiIvPjxwYXRoIGQ9Ik0tMTcsNyBMMTcsNyIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjEuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+';

Component({
  properties: {
    icon: { type: String, value: '' }, // 兼容旧调用：固定图标后忽略此属性
    title: { type: String, value: '暂无数据' },
    desc: { type: String, value: '' },
    action: { type: String, value: '' },
    compact: { type: Boolean, value: false }
  },
  data: {
    iconSrc: EMPTY_ICON_SRC
  },
  methods: {
    onAction() { this.triggerEvent('action'); }
  }
});
