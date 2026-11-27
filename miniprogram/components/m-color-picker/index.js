const palette = require('../../utils/color-palette.js');

function normalize(colors) {
  return (colors || []).map(function (c) {
    const isObject = typeof c === 'object' && c !== null;
    const value = isObject ? c.value : c;
    const label = isObject ? (c.label || palette.getColorLabel(value)) : palette.getColorLabel(value);
    return {
      key: value,
      value: value,
      label: label,
      checkColor: palette.getContrastColor(value),
      checkShadow: palette.getContrastColor(value) === '#FFFFFF'
        ? 'drop-shadow(0 1rpx 2rpx rgba(0,0,0,0.5))'
        : 'drop-shadow(0 1rpx 2rpx rgba(255,255,255,0.6))'
    };
  });
}

Component({
  properties: {
    // 不传则使用固定色板，色板与主题无关
    colors: { type: Array, value: palette.COLOR_OPTIONS },
    color: { type: String, value: '' },
    size: { type: String, value: '' }
  },

  observers: {
    'colors': function (colors) {
      this.setData({ _items: normalize(colors) });
    }
  },

  data: {
    _items: normalize(palette.COLOR_OPTIONS)
  },

  lifetimes: {
    attached() {
      // 部分基础库对 properties 默认值不触发 observer，这里兜底一次
      if (!this.data._items.length) {
        this.setData({ _items: normalize(this.data.colors) });
      }
    }
  },

  methods: {
    selectColor(e) {
      const value = e.currentTarget.dataset.value;
      const label = e.currentTarget.dataset.label || palette.getColorLabel(value);
      this.triggerEvent('change', { color: value, label: label });
    }
  }
});
