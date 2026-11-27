const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
const dateUtil = require('../../../utils/date.js');
const diaryUtil = require('../../../utils/diary.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    diary: null,
    detailWeatherIcon: '',
    detailWeatherLabel: '',
    dateLabel: '',
    createdAtLabel: '',
    updatedAtLabel: ''
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDiary();
  },

  onShow() {
    // 编辑页保存返回后静默刷新，避免详情停留在旧数据
    if (this.data.id && this._loaded) this.loadDiary(false);
  },

  async loadDiary(showLoading) {
    const withLoading = showLoading !== false;
    if (withLoading) wx.showLoading({ title: '加载中', mask: true });
    try {
      const diary = await db.getById(db.COLLECTIONS.DIARY, this.data.id);
      if (diary) {
        this._loaded = true;
        // 历史天气可能存中文 label，统一转成图标名再回显
        const weather = diaryUtil.WEATHER_VALUE_OF[diary.weather] || diary.weather || '';
        this.setData({
          diary,
          detailWeatherIcon: weather,
          detailWeatherLabel: weather ? (diaryUtil.WEATHER_LABELS[weather] || weather) : '',
          dateLabel: diaryUtil.formatDateLabel(diary.date),
          createdAtLabel: dateUtil.friendlyTime(diary.createdAt),
          updatedAtLabel: diary.updatedAt ? dateUtil.friendlyTime(diary.updatedAt) : ''
        });
        if (diary.title) {
          wx.setNavigationBarTitle({ title: diary.title });
        } else {
          wx.setNavigationBarTitle({ title: '日记详情' });
        }
      } else {
        ui.toast('日记不存在', 'none');
        setTimeout(() => wx.navigateBack(), 1000);
      }
    } catch (err) {
      ui.toast('加载失败', 'none');
    } finally {
      if (withLoading) wx.hideLoading();
    }
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/diary/editor/index?id=${this.data.id}` });
  },

  async copyContent() {
    if (!this.data.diary) return;
    const d = this.data.diary;
    let text = '';
    if (d.title) text += d.title + '\n\n';
    text += d.content + '\n\n';
    text += `— ${d.date} ${d.mood || ''}${d.weather ? ' ' + d.weather : ''}`;
    if (d.tags && d.tags.length > 0) {
      text += '\n' + d.tags.map(t => '#' + t).join(' ');
    }
    wx.setClipboardData({
      data: text,
      success: () => ui.toast('已复制')
    });
  },

  previewImage(e) {
    const idx = e.currentTarget.dataset.index;
    imageUtil.preview(idx, this.data.diary.images);
  },

  async deleteDiary() {
    const res = await ui.confirmDeleteLegacy()
    if (!res.confirm) return;

    imageUtil.cleanAllImages(this.data.diary.images);
    await db.remove(db.COLLECTIONS.DIARY, this.data.id);
    ui.toast('已删除');
    setTimeout(() => wx.navigateBack(), 500);
  },

  onShareAppMessage() {
    const d = this.data.diary;
    return {
      title: d.title || `我的日记 - ${d.date}`,
      path: `/pages/diary/detail/index?id=${d._id}`
    };
  }
});