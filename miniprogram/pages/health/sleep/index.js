const db = require('../../../utils/db.js');
const ui = require('../../../utils/interaction.js');
const healthUtil = require('../../../utils/health.js');

const QUALITY_LABELS = ['', '极差', '较差', '一般', '不错', '极好'];
const theme = require('../../../utils/theme.js');

Page({
  data: {
    profileId: '',
    records: [],
    chartPoints: [],
    chartRangeIdx: 0,
    chartRanges: [7, 14, 30],
    ranges: [
      { label: '近7天', days: 7 },
      { label: '近14天', days: 14 },
      { label: '近30天', days: 30 }
    ],
    durationStats: null,
    avgQuality: '',
    idealRate: 0
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId || '' });
  },

  async onShow() {
    if (!this.data.profileId) return;
    await this.loadData();
    this.drawChart();
  },

  async loadData() {
    const all = await db.getAll(db.COLLECTIONS.HEALTH_SLEEP, { profileId: this.data.profileId });
    const records = all.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    records.forEach(r => {
      r._durationStr = r.duration ? r.duration + 'h' : '';
      r._qualityLabel = QUALITY_LABELS[r.quality] || '—';
      r._isEnough = r.duration >= 7 && r.duration <= 9;
    });

    const rangeDays = this.data.ranges[this.data.chartRangeIdx].days;
    const points = healthUtil.buildChartPoints(all, 'date', 'duration', rangeDays);

    const durationValues = records.map(r => parseFloat(r.duration)).filter(v => v);
    const durationStats = healthUtil.calcStats(durationValues);
    const enoughCount = durationValues.filter(v => v >= 7 && v <= 9).length;
    const idealRate = durationValues.length > 0 ? Math.round(enoughCount / durationValues.length * 100) : 0;

    const qualityValues = records.map(r => r.quality).filter(v => v);
    const avgQuality = qualityValues.length > 0 ? (qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length).toFixed(1) : '';

    this.setData({ records, chartPoints, durationStats, avgQuality, idealRate });
  },

  onRangeChange(e) {
    this.setData({ chartRangeIdx: parseInt(e.detail.value) });
    this.loadData();
  },

  drawChart() {
    const p = theme.getChartPalette();
    const ctx = wx.createCanvasContext('sleepChart');
    const rangeDays = this.data.ranges[this.data.chartRangeIdx].days;
    const points = healthUtil.buildChartPoints(this.data.records, 'date', 'duration', rangeDays);
    healthUtil.drawLineChart(ctx, points, {
      width: 345,
      height: 160,
      lineColor: p.series[3],
      fillColor: theme.hexToRgba(p.series[3], 0.15)
    });
    ctx.draw();
  },


  onRangesChange() { this.drawChart(); },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/health/sleep/edit?profileId=${this.data.profileId}&id=${id}`
    });
  },

  async onItemLongPress(e) {
    const action = await ui.showItemActions();
    if (action === 'edit') this.goEdit(e);
    if (action === 'delete') await this.deleteItem(e);
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    ui.confirmDeleteWith({ title: "确认删除", content: "删除后不可恢复" }, async (res) => {
        if (res.confirm) {
          await db.remove(db.COLLECTIONS.HEALTH_SLEEP, id);
          ui.toast('已删除');
          await this.loadData();
          this.drawChart();
        }
      }
    );
  },

  goNew() {
    wx.navigateTo({
      url: `/pages/health/sleep/edit?profileId=${this.data.profileId}`
    });
  }
});