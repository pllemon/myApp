Component({
  properties: {
    label: { type: String, value: '' },
    options: { type: Array, value: [] },
    currentValue: { type: null, value: '' },
    activeBy: { type: String, value: 'value' },
    multiple: { type: Boolean, value: false },
    closeOnSelect: { type: Boolean, value: true }
  },
  data: {
    show: false,
    _activeFlags: []
  },
  observers: {
    'options, currentValue, multiple, activeBy': function() {
      const { options, currentValue, multiple, activeBy } = this.data;
      const flags = (options || []).map((opt, i) => {
        if (multiple) {
          if (!Array.isArray(currentValue)) return false;
          const v = typeof opt === 'object' && opt !== null ? opt.value : opt;
          return currentValue.indexOf(v) >= 0;
        }
        if (activeBy === 'index') return currentValue === i;
        const v = typeof opt === 'object' && opt !== null ? opt.value : opt;
        return v === currentValue;
      });
      this.setData({ _activeFlags: flags });
    }
  },
  methods: {
    toggle() {
      this.setData({ show: !this.data.show });
    },
    select(e) {
      const idx = e.currentTarget.dataset.index;
      const option = this.data.options[idx];
      const isObject = typeof option === 'object' && option !== null;
      const value = isObject ? option.value : option;
      if (this.data.multiple) {
        const cur = Array.isArray(this.data.currentValue) ? this.data.currentValue.slice() : [];
        const pos = cur.indexOf(value);
        if (pos >= 0) cur.splice(pos, 1); else cur.push(value);
        this.triggerEvent('change', { values: cur, value, index: idx, option });
      } else {
        const patch = {};
        if (this.data.closeOnSelect) patch.show = false;
        this.setData(patch);
        this.triggerEvent('change', { value, index: idx, option });
      }
    }
  }
});