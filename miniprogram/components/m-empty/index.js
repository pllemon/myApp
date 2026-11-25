Component({
  properties: {
    icon: { type: String, value: '📭' },
    title: { type: String, value: '暂无数据' },
    desc: { type: String, value: '' },
    action: { type: String, value: '' },
    compact: { type: Boolean, value: false }
  },
  methods: {
    onAction() { this.triggerEvent('action'); }
  }
});