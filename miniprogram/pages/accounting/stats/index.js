const db = require('../../../utils/db.js');
const bookUtil = require('../../../utils/book.js');
const dateUtil = require('../../../utils/date.js');
const chartUtil = require('../../../utils/chart.js');
const theme = require('../../../utils/theme.js');

Page({
  data: {
    loading: true,
    total: { expense: '0.00', income: '0.00', balance: '0.00' },
    years: [],
    chartsReady: false,
    pieCanvas: 'pieChart',
    barCanvas: 'barChart',
    trendCanvas: 'trendChart',
    chartData: {
      pieData: [],
      barData: [],
      trendData: []
    },
    categoryLegend: []
  },

  onShow() {
    this.loadStats();
  },

  async loadStats() {
    this.setData({ loading: true });
    const p = theme.getChartPalette();
    const bookId = bookUtil.getCurrentBookId();
    let records;
    try {
      records = await db.query(db.COLLECTIONS.ACCOUNTING, { bookId });
    } catch (e) {
      console.error('loadStats error:', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
      return;
    }

    let totalExpense = 0, totalIncome = 0;
    const monthMap = {};
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    let currentMonthExpense = 0;
    const categoryExpenseMap = {};

    records.forEach(r => {
      if (r.type !== 'expense' && r.type !== 'income') return;
      const biz = dateUtil.bizDateOf(r);
      if (!biz) return;
      const [y, m] = biz.slice(0, 7).split('-').map(Number);
      const key = `${y}-${m}`;
      if (!monthMap[key]) monthMap[key] = { year: y, month: m, expense: 0, income: 0 };
      if (r.type === 'expense') {
        totalExpense += r.amount || 0;
        monthMap[key].expense += r.amount || 0;
        if (y === currentYear && m === currentMonth) {
          currentMonthExpense += r.amount || 0;
          const catName = r.categoryName || r.category || '其他';
          const catId = r.categoryId || r.parentCategoryId || '';
          const catKey = catId || catName;
          if (!categoryExpenseMap[catKey]) categoryExpenseMap[catKey] = { name: catName, id: catId, value: 0 };
          categoryExpenseMap[catKey].value += (r.amount || 0);
        }
      } else if (r.type === 'income') {
        totalIncome += r.amount || 0;
        monthMap[key].income += r.amount || 0;
      }
    });

    const yearMap = {};
    Object.values(monthMap).forEach(m => {
      if (!yearMap[m.year]) yearMap[m.year] = { year: m.year, expense: 0, income: 0, months: [] };
      yearMap[m.year].expense += m.expense;
      yearMap[m.year].income += m.income;
      yearMap[m.year].months.push(m);
    });

    const years = Object.values(yearMap)
      .sort((a, b) => b.year - a.year)
      .map(y => ({
        year: y.year,
        expenseStr: y.expense.toFixed(2),
        incomeStr: y.income.toFixed(2),
        balanceStr: (y.income - y.expense).toFixed(2),
        expanded: false,
        months: y.months
          .sort((a, b) => a.month - b.month)
          .map(m => ({
            ...m,
            balance: m.income - m.expense,
            expenseStr: m.expense.toFixed(2),
            incomeStr: m.income.toFixed(2),
            balanceStr: (m.income - m.expense).toFixed(2)
          }))
      }));

    const pieData = Object.entries(categoryExpenseMap)
      .map(([id, item]) => ({ id, name: item.name, value: item.value, color: chartUtil.getCategoryColor(item.name) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const categoryLegend = pieData;

    const barMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;
      const md = monthMap[key] || { expense: 0, income: 0 };
      barMonths.push({
        label: `${m}月`,
        value1: md.expense,
        value2: md.income,
        color1: p.danger,
        color2: p.success
      });
    }

    const trendData = barMonths.map(b => ({
      label: b.label,
      value: b.value2 - b.value1,
      color: p.primary
    }));

    this.setData({
      total: {
        expense: totalExpense.toFixed(2),
        income: totalIncome.toFixed(2),
        balance: (totalIncome - totalExpense).toFixed(2)
      },
      years,
      chartData: { pieData, barData: barMonths, trendData },
      categoryLegend,
      currentYear,
      currentMonth,
      chartsReady: true,
      loading: false
    }, () => {
      setTimeout(() => this.drawCharts(), 100);
    });
  },

  drawCharts() {
    const p = theme.getChartPalette();
    const { pieData, barData, trendData } = this.data.chartData;
    const sysInfo = wx.getSystemInfoSync();
    const pixelRatio = sysInfo.pixelRatio || 2;

    const pieCanvas = wx.createCanvasContext('pieChart', this);
    pieCanvas.clearRect(0, 0, 300, 260);
    if (pieData.length > 0) {
      chartUtil.drawPie(pieCanvas, pieData, { cx: 130, cy: 130, radius: 100, donutWidth: 48 });
    }
    pieCanvas.draw();

    const barCanvas = wx.createCanvasContext('barChart', this);
    barCanvas.clearRect(0, 0, 340, 200);
    barCanvas.fillStyle = p.grid;
    barCanvas.fillRect(20, 10, 300, 2);
    if (barData.length > 0) {
      chartUtil.drawBar(barCanvas, barData, { x: 20, y: 20, width: 300, height: 150 });
    }
    barCanvas.draw();

    const trendCanvas = wx.createCanvasContext('trendChart', this);
    trendCanvas.clearRect(0, 0, 340, 200);
    trendCanvas.fillStyle = p.grid;
    trendCanvas.fillRect(20, 10, 300, 2);
    if (trendData.length > 0) {
      chartUtil.drawTrend(trendCanvas, trendData, { x: 20, y: 20, width: 300, height: 150 });
    }
    trendCanvas.draw();
  },

  toggleYear(e) {
    const index = e.currentTarget.dataset.index;
    const key = `years[${index}].expanded`;
    this.setData({ [key]: !this.data.years[index].expanded });
  },

  goMonthDetail(e) {
    const { year, month } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/accounting/stats/month?year=${year}&month=${month}`
    });
  },

  goCategoryDetail(e) {
    this.navigateToCategory(e.currentTarget.dataset.id);
  },

  navigateToCategory(id) {
    if (!id) return;
    wx.navigateTo({
      url: `/pages/accounting/stats/month?year=${this.data.currentYear}&month=${this.data.currentMonth}&categoryId=${id}`
    });
  },

  // 点击环形图扇区：把画布坐标换算成角度，命中分类后下钻到月明细
  onPieTap(e) {
    const pieData = this.data.chartData && this.data.chartData.pieData;
    if (!pieData || pieData.length === 0) return;
    const dx = (e.detail.x || 0) - 130;
    const dy = (e.detail.y || 0) - 130;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // 环形区域：内半径 52、外半径 100（与 drawPie 的 donutWidth 一致）
    if (dist < 52 || dist > 100) return;

    let angle = Math.atan2(dy, dx); // 与 canvas arc 同为顺时针角度体系
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    const rel = angle + Math.PI / 2; // 从 12 点方向起算 [0, 2π)

    const total = pieData.reduce((s, d) => s + (d.value || 0), 0);
    if (total <= 0) return;
    let acc = 0;
    for (const d of pieData) {
      acc += (d.value / total) * Math.PI * 2;
      if (rel < acc) {
        this.navigateToCategory(d.id);
        return;
      }
    }
  }
});