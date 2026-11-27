const db = require('../../../utils/db.js');
const util = require('../../../utils/reading.js');
const ui = require('../../../utils/interaction.js');
const detail = require('../../../utils/detail-page.js');

Page(detail.createDetailPage({
  collection: db.COLLECTIONS.READING,
  editPath: '/pages/reading/edit/index',
  titleKey: 'title',
  defaultTitle: '书籍详情',
  emptyTip: '书籍不存在',
  decorate(raw) {
    const decorated = util.decorate(raw);
    decorated.pageText = util.formatPage(raw);
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
        console.error('reading detail quickAction error:', err);
        ui.toast('操作失败', 'none');
      }
    },
    async rateReading(e) {
      const item = this.data.item;
      if (!item) return;
      const rating = Number((e.currentTarget.dataset && e.currentTarget.dataset.rating) || 0);
      if (!rating) return;
      try {
        await db.update(db.COLLECTIONS.READING, item._id, { rating });
        ui.toast('评分已更新');
        await this.loadDetail(false);
      } catch (err) {
        console.error('reading detail rateReading error:', err);
        ui.toast('操作失败', 'none');
      }
    }
  }
}));
