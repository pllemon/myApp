const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

const TYPE_MAP = {
  walk: '🚶 步行', run: '🏃 跑步', cycle: '🚴 骑行', swim: '🏊 游泳',
  yoga: '🧘 瑜伽', gym: '🏋️ 健身', ball: '⚽ 球类', dance: '💃 舞蹈',
  hike: '🥾 徒步', other: '其他'
};

Page({
  data: {
    profileId: '',
    records: [],
    ranges: [
      { label: '近7天', days: 7 },
      { label: '近14天', days: 14 },
      { label: '近30天', days: 30 }
    ],
    chartRangeIdx: 0,
    totalStats: null,
    weekStats: null
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId || '' });
  },

  async onShow() {
    if (!this.data.profileId) return;
    await this.loadData();
  },

  async loadData() {
    const all = await db.getAll(db.COLLECTIONS.HEALTH_EXERCISE, { profileId: this.data.profileId });
    const records = all.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    records.forEach(r => {
      r._typeLabel = TYPE_MAP[r.type] || r.type || '其他';
      r._durationStr = r.duration ? r.duration + '分钟' : '';
      r._distanceStr = r.distance ? r.distance + 'km' : '';
      r._caloriesStr = r.calories ? r.calories + 'kcal' : '';
    });

    const chartRangeDays = this.data.ranges[this.data.chartRangeIdx].days;
    this.setData({ records });
  },

  drawChart() {
    const ctx = wx.createCanvasContext('exerciseChart');
    const chartRangeDays = this.data.ranges[this.data.chartRangeIdx].days;
    const points = healthUtil.buildChartPoints(this.data.records, 'date', 'duration', chartRangeDays);
    healthUtil.drawLineChart(ctx, points, {
      width: 345,
      height: 160,
      lineColor: '#66BB6A',
      fillColor: 'rgba(102, 187, 106, 0.15)'
    });
    ctx.draw();
  },

  onRangeChange(e) {
    this.setData({ chartRangeIdx: parseInt(e.detail.value) });
    this.drawChart();
  },

  onReady() { this.drawChart(); },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/health/exercise/edit?profileId=${this.data.profileId}&id=${id}`
    });
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async (res) => {
        if (res.confirm) {
          await db.remove(db.COLLECTIONS.HEALTH_EXERCISE, id);
          wx.showToast({ title: '已删除', icon: 'success' });
          await this.loadData();
          this.drawChart();
        }
      }
    });
  },

  goNew() {
    wx.navigateTo({
      url: `/pages/health/exercise/edit?profileId=${this.data.profileId}`
    });
  }
});