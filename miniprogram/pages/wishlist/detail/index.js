const db = require('../../../utils/db.js');
const util = require('../../../utils/wishlist.js');
const ui = require('../../../utils/interaction.js');
const dateUtil = require('../../../utils/date.js');
const detail = require('../../../utils/detail-page.js');

Page(detail.createDetailPage({
  collection: db.COLLECTIONS.WISHLIST,
  editPath: '/pages/wishlist/edit/index',
  titleKey: 'title',
  defaultTitle: '心愿详情',
  emptyTip: '心愿不存在',
  decorate(raw) {
    const decorated = util.decorate(raw);
    decorated.budgetText = raw.budget ? '¥' + Number(raw.budget).toFixed(2) : '';
    decorated.achievedAtLabel = raw.achievedAt ? dateUtil.friendlyTime(raw.achievedAt) : '';
    decorated.dueLabel = '';
    if (raw.targetDate) {
      if (raw.achieved || raw.targetDate >= dateUtil.today()) {
        decorated.dueLabel = raw.targetDate;
      } else {
        decorated.dueLabel = '已逾期 · ' + raw.targetDate;
      }
    }
    return decorated;
  },

  onLoaded(item) {
    this.setData({ quickLabel: item.achieved ? '取消实现' : '标记实现' });
  },

  extraMethods: {
    async quickAction() {
      const item = this.data.item;
      if (!item) return;
      try {
        await util.toggleAchieved(item);
        ui.toast('已更新');
        await this.loadDetail(false);
      } catch (err) {
        console.error('wishlist detail quickAction error:', err);
        ui.toast('操作失败', 'none');
      }
    }
  }
}));
