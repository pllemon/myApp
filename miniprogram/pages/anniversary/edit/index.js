const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
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
    const icon = e.detail ? e.detail.icon : e.currentTarget.dataset.icon;
    this.setData({ icon });
  },

  selectColor(e) {
    const c = e.detail.color;
    this.setData({ color: c, colorTranslucent: util.hexToRgba(c, 0.8) });
  },

  selectRepeat(e) {
    this.setData({ repeat: e.currentTarget.dataset.key });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  async save() {
    const title = (this.data.title || '').trim();
    if (!title) {
      ui.toast('请输入纪念日名称', 'none');
      return;
    }
    if (!this.data.date) {
      ui.toast('请选择日期', 'none');
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
      ui.toast('已保存');
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error('anniversary save error:', e);
      ui.toast('保存失败', 'none');
    }
  },

  remove() {
    if (!this.data.isEdit) return;
    ui.confirmDeleteWith({ title: "确认删除", content: "删除后不可恢复" }, async (res) => {
        if (!res.confirm) return;
        try {
          const old = await db.getById(db.COLLECTIONS.ANNIVERSARY, this.data.id);
          if (old) imageUtil.cleanAllImages(old.images);
          await db.remove(db.COLLECTIONS.ANNIVERSARY, this.data.id);
          ui.toast('已删除');
          setTimeout(() => wx.navigateBack(), 500);
        } catch (e) {
          console.error('anniversary remove error:', e);
        }
      }
    );
  }
});