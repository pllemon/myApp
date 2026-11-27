Component({
  properties: {
    saveText: { type: String, value: '保存' },
    showDelete: { type: Boolean, value: false },
    fixed: { type: Boolean, value: true },
    variant: { type: String, value: '' },
    disabled: { type: Boolean, value: false }
  },
  data: {
    saving: false
  },
  lifetimes: {
    detached() {
      if (this._unlockTimer) clearTimeout(this._unlockTimer);
    }
  },
  methods: {
    onSave() {
      if (this.data.disabled || this.data.saving) return;
      this.setData({ saving: true });
      this.triggerEvent('save');
      // 内部防抖兜底：页面无需改动即可挡住连续点击，1.2s 后自动解锁
      if (this._unlockTimer) clearTimeout(this._unlockTimer);
      this._unlockTimer = setTimeout(() => {
        this._unlockTimer = null;
        this.setData({ saving: false });
      }, 1200);
    },
    onDelete() {
      if (this.data.disabled) return;
      this.triggerEvent('delete');
    }
  }
});