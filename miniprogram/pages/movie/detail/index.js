const db = require('../../../utils/db.js');
const util = require('../../../utils/movie.js');
const ui = require('../../../utils/interaction.js');
const detail = require('../../../utils/detail-page.js');

Page(detail.createDetailPage({
  collection: db.COLLECTIONS.MOVIE,
  editPath: '/pages/movie/edit/index',
  titleKey: 'title',
  defaultTitle: '影片详情',
  emptyTip: '影片不存在',
  decorate(raw) {
    const decorated = util.decorate(raw);
    decorated.durationText = util.formatDuration(raw.duration);
    return decorated;
  },

  onLoaded(item) {
    const order = util.STATUS_LIST;
    const idx = order.indexOf(item.status);
    const next = order[(idx + 1) % order.length];
    this.setData({ nextStatusLabel: util.STATUS[next].label });
  },

  extraMethods: {
    async quickAction() {
      const item = this.data.item;
      if (!item) return;
      try {
        await util.toggleStatus(item);
        ui.toast('已更新');
        await this.loadDetail(false);
      } catch (err) {
        console.error('movie detail quickAction error:', err);
        ui.toast('操作失败', 'none');
      }
    },
    async rateMovie(e) {
      const item = this.data.item;
      if (!item) return;
      const rating = Number((e.currentTarget.dataset && e.currentTarget.dataset.rating) || 0);
      if (!rating) return;
      try {
        await db.update(db.COLLECTIONS.MOVIE, item._id, { rating });
        ui.toast('评分已更新');
        await this.loadDetail(false);
      } catch (err) {
        console.error('movie detail rateMovie error:', err);
        ui.toast('操作失败', 'none');
      }
    }
  }
}));
