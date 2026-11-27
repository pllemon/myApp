const db = require('../../../utils/db.js');
const util = require('../../../utils/anniversary.js');
const dateUtil = require('../../../utils/date.js');
const detail = require('../../../utils/detail-page.js');

Page(detail.createDetailPage({
  collection: db.COLLECTIONS.ANNIVERSARY,
  editPath: '/pages/anniversary/edit/index',
  titleKey: 'title',
  defaultTitle: '纪念日详情',
  emptyTip: '纪念日不存在',
  decorate(raw) {
    return util.decorate(raw, dateUtil.today());
  }
}));
