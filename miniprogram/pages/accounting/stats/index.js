const db = require('../../../utils/db.js');
const bookUtil = require('../../../utils/book.js');
const chartUtil = require('../../../utils/chart.js');

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
    const bookId = bookUtil.getCurrentBookId();
    const records = await db.query(db.COLLECTIONS.ACCOUNTING, { bookId });

    let totalExpense = 0, totalIncome = 0;
    const monthMap = {};
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    let currentMonthExpense = 0;
    const categoryExpenseMap = {};

    records.forEach(r => {
      if (r.type !== 'expense' && r.type !== 'income') return;
      const d = new Date(r.createdAt);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;
      if (!monthMap[key]) monthMap[key] = { year: y, month: m, expense: 0, income: 0 };
      if (r.type === 'expense') {
        totalExpense += r.amount || 0;
        monthMap[key].expense += r.amount || 0;
        if (y === currentYear && m === currentMonth) {
          currentMonthExpense += r.amount || 0;
          const catKey = r.categoryName || r.category || '其他';
          categoryExpenseMap[catKey] = (categoryExpenseMap[catKey] || 0) + (r.amount || 0);
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
      .map(([name, value]) => ({ name, value, color: chartUtil.getCategoryColor(name) }))
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
        color1: '#FF4D4F',
        color2: '#7ED321'
      });
    }

    const trendData = barMonths.map(b => ({
      label: b.label,
      value: b.value2 - b.value1,
      color: '#4A90D9'
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
      chartsReady: true,
      loading: false
    }, () => {
      setTimeout(() => this.drawCharts(), 100);
    });
  },

  drawCharts() {
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
    barCanvas.fillStyle = '#E8E8E8';
    barCanvas.fillRect(20, 10, 300, 2);
    if (barData.length > 0) {
      chartUtil.drawBar(barCanvas, barData, { x: 20, y: 20, width: 300, height: 150 });
    }
    barCanvas.draw();

    const trendCanvas = wx.createCanvasContext('trendChart', this);
    trendCanvas.clearRect(0, 0, 340, 200);
    trendCanvas.fillStyle = '#E8E8E8';
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
  }
});