const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const diaryUtil = require('../../../utils/diary.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    diary: null,
    dateLabel: '',
    createdAtLabel: '',
    updatedAtLabel: ''
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDiary();
  },

  async loadDiary() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const diary = await db.getById(db.COLLECTIONS.DIARY, this.data.id);
      if (diary) {
        this.setData({
          diary,
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
        wx.showToast({ title: '日记不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1000);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
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
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  previewImage(e) {
    const idx = e.currentTarget.dataset.index;
    imageUtil.preview(idx, this.data.diary.images);
  },

  async deleteDiary() {
    const res = await wx.showModal({
      title: '删除日记',
      content: '确定删除这篇日记吗？此操作不可恢复。',
      confirmColor: '#E74C3C'
    });
    if (!res.confirm) return;

    imageUtil.cleanAllImages(this.data.diary.images);
    await db.remove(db.COLLECTIONS.DIARY, this.data.id);
    wx.showToast({ title: '已删除', icon: 'success' });
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