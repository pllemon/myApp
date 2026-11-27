/**
 * 固定色板 —— 不随主题切换而变化。
 *
 * 说明：
 * 1. 这里只放「用户可选的内容色」，用于打卡习惯、纪念日、账本等自定义标记色；
 *    页面/组件自身的 UI 色仍走主题 token，两者互不干扰。
 * 2. 历史数据中出现过的色值全部保留在色板内，旧记录编辑时仍能正确命中选中态。
 * 3. 按色系分组但对外提供扁平数组，方便 m-color-picker 直接渲染。
 */

const COLOR_GROUPS = [
  {
    key: 'red',
    label: '红系',
    colors: [
      { label: '珊瑚红', value: '#FF6B6B' },
      { label: '砖红', value: '#E74C3C' },
      { label: '浅红', value: '#FF8A80' },
      { label: '柔红', value: '#E57373' },
      { label: '深红', value: '#C0392B' },
      { label: '酒红', value: '#922B21' }
    ]
  },
  {
    key: 'pink',
    label: '粉系',
    colors: [
      { label: '樱花粉', value: '#FF6B9D' },
      { label: '蜜桃粉', value: '#FF6B81' },
      { label: '糖果粉', value: '#F4A8BC' },
      { label: '浅粉', value: '#F8BBD0' },
      { label: '玫红', value: '#E91E63' },
      { label: '莓紫', value: '#AD1457' }
    ]
  },
  {
    key: 'orange',
    label: '橙系',
    colors: [
      { label: '蜜橙', value: '#FF9F43' },
      { label: '琥珀', value: '#F5A623' },
      { label: '杏橙', value: '#F39C12' },
      { label: '橘橙', value: '#E67E22' },
      { label: '珊瑚橙', value: '#FF8A65' },
      { label: '暖黄', value: '#FECA57' }
    ]
  },
  {
    key: 'yellow',
    label: '黄系',
    colors: [
      { label: '奶黄', value: '#F6D68A' },
      { label: '明黄', value: '#FDD835' },
      { label: '沙金', value: '#E3C27D' },
      { label: '麦色', value: '#D4BC8A' },
      { label: '柠檬', value: '#FFF176' },
      { label: '焦糖', value: '#D4A24C' }
    ]
  },
  {
    key: 'green',
    label: '绿系',
    colors: [
      { label: '薄荷绿', value: '#2ECC71' },
      { label: '青草绿', value: '#52C41A' },
      { label: '翡翠绿', value: '#27AE60' },
      { label: '嫩绿', value: '#8BC34A' },
      { label: '青碧', value: '#16A085' },
      { label: '湖水绿', value: '#1ABC9C' }
    ]
  },
  {
    key: 'blue',
    label: '蓝系',
    colors: [
      { label: '天蓝', value: '#4A90D9' },
      { label: '湖蓝', value: '#3498DB' },
      { label: '浅蓝', value: '#64B5F6' },
      { label: '亮蓝', value: '#2196F3' },
      { label: '深蓝', value: '#1976D2' },
      { label: '雾蓝', value: '#A8CCE8' }
    ]
  },
  {
    key: 'purple',
    label: '紫系',
    colors: [
      { label: '薰衣紫', value: '#9B59B6' },
      { label: '葡萄紫', value: '#8E44AD' },
      { label: '淡紫', value: '#BA68C8' },
      { label: '灰紫', value: '#B997B5' },
      { label: '丁香紫', value: '#C9B6E4' },
      { label: '深紫', value: '#7E57C2' }
    ]
  },
  {
    key: 'neutral',
    label: '中性',
    colors: [
      { label: '石板灰', value: '#34495E' },
      { label: '墨蓝灰', value: '#2C3E50' },
      { label: '蓝灰', value: '#607D8B' },
      { label: '银灰', value: '#95A5A6' },
      { label: '浅灰', value: '#BDC3C7' },
      { label: '棕咖', value: '#8D6E63' }
    ]
  }
];

// 扁平化，保留中文名，供 m-color-picker 直接消费
const COLOR_OPTIONS = COLOR_GROUPS.reduce(function (all, group) {
  return all.concat(group.colors);
}, []);

// 纯色值数组，供只存 hex 的模块使用
const COLOR_VALUES = COLOR_OPTIONS.map(function (item) { return item.value; });

const COLOR_LABELS = COLOR_OPTIONS.reduce(function (map, item) {
  map[item.value.toUpperCase()] = item.label;
  return map;
}, {});

function getColorLabel(value) {
  return COLOR_LABELS[String(value || '').toUpperCase()] || '';
}

/** 按色块明暗返回固定对比色，保证浅色块上也能看清勾选标记 */
function getContrastColor(value) {
  const hex = String(value || '').replace('#', '');
  const full = hex.length === 3 ? hex.split('').map(function (c) { return c + c; }).join('') : hex;
  if (full.length !== 6) return '#FFFFFF';
  const r = parseInt(full.substr(0, 2), 16);
  const g = parseInt(full.substr(2, 2), 16);
  const b = parseInt(full.substr(4, 2), 16);
  const lightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lightness > 0.65 ? '#2F2F2F' : '#FFFFFF';
}

module.exports = {
  COLOR_GROUPS,
  COLOR_OPTIONS,
  COLOR_VALUES,
  getColorLabel,
  getContrastColor
};
