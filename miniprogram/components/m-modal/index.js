Component({
  options: { multipleSlots: true },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    position: { type: String, value: 'center' },
    showClose: { type: Boolean, value: true },
    showConfirm: { type: Boolean, value: false },
    showCancel: { type: Boolean, value: false },
    confirmText: { type: String, value: '确定' },
    cancelText: { type: String, value: '取消' },
    confirmDisabled: { type: Boolean, value: false },
    closeOnMask: { type: Boolean, value: true }
  },
  methods: {
    onMaskTap() {
      if (this.data.closeOnMask) this.triggerEvent('close');
    },
    onClose() {
      this.triggerEvent('close');
    },
    onConfirm() {
      if (this.data.confirmDisabled) return;
      this.triggerEvent('confirm');
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    noop() {}
  }
});
