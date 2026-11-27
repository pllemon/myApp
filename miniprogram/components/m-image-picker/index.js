const imageUtil = require('../../utils/image.js');

Component({
  properties: {
    images: { type: Array, value: [] },
    max: { type: Number, value: 9 },
    size: { type: String, value: '' },
    label: { type: String, value: '' },
    readonly: { type: Boolean, value: false }
  },
  methods: {
    async chooseImages() {
      if (this.data.readonly) return;
      const paths = await imageUtil.chooseImages((this.data.images || []).length, this.data.max);
      if (paths.length > 0) {
        const images = [...(this.data.images || []), ...paths];
        this.setData({ images });
        this.triggerEvent('change', { images });
      }
    },
    previewImage(e) {
      const index = Number(e.currentTarget.dataset.index);
      imageUtil.preview(index, this.data.images || []);
    },
    removeImage(e) {
      if (this.data.readonly) return;
      const index = Number(e.currentTarget.dataset.index);
      const images = imageUtil.removeAt(this.data.images || [], index);
      this.setData({ images });
      this.triggerEvent('change', { images });
    },
    noop() {}
  }
});
