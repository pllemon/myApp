Component({
  options: { multipleSlots: true },
  properties: {
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    empty: { type: Boolean, value: false },
    emptyText: { type: String, value: '暂无数据' },
    emptyIcon: { type: String, value: 'chart' },
    flush: { type: Boolean, value: false }
  }
});
