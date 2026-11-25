const db = require('../../../utils/db.js');
const util = require('../../../utils/anniversary.js');
const dateUtil = require('../../../utils/date.js');
const theme = require('../../../utils/theme.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    icon: util.ICONS[0],
    color: util.COLORS[0],
    colorTranslucent: util.hexToRgba(util.COLORS[0], 0.8),
    repeat: 'annual',
    date: '',
    note: '',
    images: [],
    icons: util.ICONS,
    colors: util.COLORS,
    repeatOptions: [
      { key: 'annual', label: '每年重复' },
      { key: 'none', label: '仅一次' }
    ],
    today: ''
  },

  onLoad(options) {
    theme.applyToPage(this);
    const today = dateUtil.today();
    this.setData({ today, date: today });
    if (options && options.id) {
      this.setData({ id: options.id, isEdit: true });
      this.load(options.id);
    }
  },

  async load(id) {
    try {
      const it = await db.getById(db.COLLECTIONS.ANNIVERSARY, id);
      if (it) {
        const c = it.color || util.COLORS[0];
        this.setData({
          title: it.title || '',
          icon: it.icon || util.ICONS[0],
          color: c,
          colorTranslucent: util.hexToRgba(c, 0.8),
          repeat: it.repeat || 'annual',
          date: it.date || '',
          note: it.note || '',
          images: it.images || []
        });
      }
    } catch (e) {
      console.error('anniversary load error:', e);
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  selectIcon(e) {
    this.setData({ icon: e.currentTarget.dataset.icon });
  },

  selectColor(e) {
    const c = e.currentTarget.dataset.color;
    this.setData({ color: c, colorTranslucent: util.hexToRgba(c, 0.8) });
  },

  selectRepeat(e) {
    this.setData({ repeat: e.currentTarget.dataset.key });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  async chooseImages() {
    const paths = await imageUtil.chooseImages(this.data.images.length);
    if (paths.length > 0) {
      this.setData({ images: [...this.data.images, ...paths] });
    }
  },

  previewImage(e) {
    const idx = e.currentTarget.dataset.index;
    imageUtil.preview(idx, this.data.images);
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ images: imageUtil.removeAt(this.data.images, idx) });
  },

  async save() {
    const title = (this.data.title || '').trim();
    if (!title) {
      wx.showToast({ title: '请输入纪念日名称', icon: 'none' });
      return;
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    const record = {
      title,
      icon: this.data.icon,
      color: this.data.color,
      repeat: this.data.repeat,
      date: this.data.date,
      note: (this.data.note || '').trim(),
      images: this.data.images
    };
    try {
      if (this.data.isEdit) {
        const old = await db.getById(db.COLLECTIONS.ANNIVERSARY, this.data.id);
        if (old) imageUtil.cleanOldImages(old.images || [], record.images);
        await db.update(db.COLLECTIONS.ANNIVERSARY, this.data.id, record);
      } else {
        await db.add(db.COLLECTIONS.ANNIVERSARY, record);
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error('anniversary save error:', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  remove() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const old = await db.getById(db.COLLECTIONS.ANNIVERSARY, this.data.id);
          if (old) imageUtil.cleanAllImages(old.images);
          await db.remove(db.COLLECTIONS.ANNIVERSARY, this.data.id);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 500);
        } catch (e) {
          console.error('anniversary remove error:', e);
        }
      }
    });
  }
});