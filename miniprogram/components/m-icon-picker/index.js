Component({
  properties: {
    icons: { type: Array, value: [] },
    value: { type: String, value: '' },
    mode: { type: String, value: 'inline' },
    show: { type: Boolean, value: false },
    title: { type: String, value: '选择图标' },
    columns: { type: Number, value: 6 },
    showCancel: { type: Boolean, value: true },
    closeOnSelect: { type: Boolean, value: true }
  },
  observers: {
    'icons, value': function (icons, value) {
      var list = Array.isArray(icons) ? icons : [];
      var items = list.map(function (icon) {
        if (icon !== null && typeof icon === 'object') {
          var text = icon.label !== undefined ? icon.label : (icon.value !== undefined ? icon.value : '');
          return { key: String(text), text: text, raw: icon.value !== undefined ? icon.value : text };
        }
        return { key: String(icon), text: String(icon), raw: icon };
      });
      var flags = items.map(function (item) { return item.raw === value; });
      this.setData({ _items: items, _activeFlags: flags });
    }
  },
  data: {
    _items: [],
    _activeFlags: []
  },
  methods: {
    onSelect(e) {
      var index = Number(e.currentTarget.dataset.index);
      var item = this.data._items[index];
      if (!item) return;
      this.triggerEvent('select', { icon: item.raw, index: index });
      if (this.data.mode === 'popup' && this.data.closeOnSelect) {
        this.triggerEvent('close');
      }
    },
    onClose() {
      this.triggerEvent('close');
    }
  }
});
