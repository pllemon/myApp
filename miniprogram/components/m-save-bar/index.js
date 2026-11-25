Component({
  properties: {
    saveText: { type: String, value: '保存' },
    showDelete: { type: Boolean, value: false },
    fixed: { type: Boolean, value: true }
  },
  methods: {
    onSave() { this.triggerEvent('save'); },
    onDelete() { this.triggerEvent('delete'); }
  }
});