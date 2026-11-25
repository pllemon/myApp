Component({
  properties: {
    label: { type: String, value: '' },
    click: { type: Boolean, value: false },
    block: { type: Boolean, value: false },
    half: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      if (this.data.click) {
        this.triggerEvent('fieldtap');
      }
    }
  }
});