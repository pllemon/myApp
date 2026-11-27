const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const checkinUtil = require('../../../utils/checkin.js');
const imageUtil = require('../../../utils/image.js');

Page({
  noop() {},
  data: {
    viewType: 'month',
    habitId: '',
    habitName: '',
    habitColor: '#4A90D9',
    monthYear: '',
    monthLabel: '',
    cells: [],
    weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
    heatmap: [],
    monthStats: { checkedDays: 0, totalDays: 0, recordsCount: 0 },
    habitRecords: [],
    habits: [],
    today: dateUtil.today(),
    selectedRecord: null,
    showRecordDetail: false
  },

  async onLoad(options) {
    let habitId = options.habitId || '';
    let habitName = '';
    let habitColor = '#4A90D9';

    if (habitId) {
      const habit = await db.getById(db.COLLECTIONS.CHECKIN_HABIT, habitId);
      if (habit) {
        habitName = habit.name;
        habitColor = habit.color;
        wx.setNavigationBarTitle({ title: `${habit.icon || ''} ${habit.name}` });
      }
    } else {
      wx.setNavigationBarTitle({ title: '打卡日历' });
      const habits = await checkinUtil.loadHabits();
      this.setData({ habits: habits || [] });
    }

    const now = new Date();
    this.setData({
      habitId,
      habitName,
      habitColor,
      monthYear: `${now.getFullYear()}-${now.getMonth() + 1}`,
      monthLabel: `${now.getFullYear()}年${now.getMonth() + 1}月`
    });
    this.loadMonth();
  },

  async loadMonth() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const [year, month] = this.data.monthYear.split('-').map(Number);
      const cells = checkinUtil.buildMonthCalendar(year, month);
      const records = await checkinUtil.loadAllCheckinRecords();

      const monthStart = dateUtil.monthStart(year, month);
      const monthEnd = dateUtil.monthEnd(year, month);

      let habitRecords = records;
      if (this.data.habitId) {
        habitRecords = records.filter(r => r.habitId === this.data.habitId);
      }
      this.setData({ habitRecords });

      const checkedDates = new Set(habitRecords.map(r => r.date));
      const totalDays = cells.filter(c => !c.empty).length;
      const checkedDays = cells.filter(c => !c.empty && checkedDates.has(c.date)).length;

      const today = dateUtil.today();
      const cellsWithCheck = cells.map(c => {
        if (c.empty) return c;
        return {
          ...c,
          checked: checkedDates.has(c.date),
          isToday: c.date === today,
          isFuture: c.date > today
        };
      });

      this.setData({
        cells: cellsWithCheck,
        monthStats: {
          checkedDays,
          totalDays,
          recordsCount: habitRecords.length
        }
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async loadYear() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const now = new Date();
      const year = now.getFullYear();
      let records = await checkinUtil.loadAllCheckinRecords();
      if (this.data.habitId) {
        records = records.filter(r => r.habitId === this.data.habitId);
      }
      const heatmap = checkinUtil.buildYearHeatmap(year, records);

      const activeDays = new Set(records.map(r => r.date)).size;
      const monthMap = {};
      records.forEach(r => {
        const m = r.date.substring(0, 7);
        monthMap[m] = (monthMap[m] || 0) + 1;
      });

      const bestMonth = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0];

      this.setData({
        heatmap,
        yearStats: {
          year,
          activeDays,
          totalCount: records.length,
          bestMonth: bestMonth ? `${bestMonth[0].replace('-', '年')}月 打卡 ${bestMonth[1]} 次` : '暂无数据'
        }
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async selectHabit(e) {
    const id = e.currentTarget.dataset.id;
    const habit = (this.data.habits || []).find(h => h._id === id);
    if (!habit) return;
    this.setData({
      habitId: id,
      habitName: habit.name,
      habitColor: habit.color || '#4A90D9'
    });
    wx.setNavigationBarTitle({ title: (habit.icon ? habit.icon + ' ' : '') + habit.name });
    await this.loadMonth();
  },

  async onHeatmapDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date || !this.data.habitId) return;
    const [y, m] = date.split('-');
    this.setData({ viewType: 'month', monthYear: y + '-' + Number(m) });
    await this.loadMonth();
    const record = (this.data.habitRecords || []).find(r => r.date === date);
    if (record) {
      this.setData({ selectedRecord: record, showRecordDetail: true });
    } else {
      wx.showToast({ title: '当日暂无该习惯的打卡记录', icon: 'none' });
    }
  },

  onSwitchView(e) {
    const view = e.currentTarget.dataset.view;
    this.setData({ viewType: view });
    if (view === 'year' && !this.data.heatmap.length) {
      this.loadYear();
    }
  },

  prevMonth() {
    const [year, month] = this.data.monthYear.split('-').map(Number);
    let newYear = year, newMonth = month - 1;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    this.setData({
      monthYear: `${newYear}-${newMonth}`,
      monthLabel: `${newYear}年${newMonth}月`
    });
    this.loadMonth();
  },

  nextMonth() {
    const [year, month] = this.data.monthYear.split('-').map(Number);
    let newYear = year, newMonth = month + 1;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    this.setData({
      monthYear: `${newYear}-${newMonth}`,
      monthLabel: `${newYear}年${newMonth}月`
    });
    this.loadMonth();
  },

  async toggleDay(e) {
    if (!this.data.habitId) {
      wx.showToast({ title: '请先选择习惯', icon: 'none' });
      return;
    }
    const { date } = e.currentTarget.dataset;
    if (!date || date > this.data.today) return;

    const record = this.data.habitRecords.find(r => r.date === date);
    if (record) {
      this.setData({ selectedRecord: record, showRecordDetail: true });
    } else {
      await checkinUtil.checkin(this.data.habitId, this.data.habitName, date);
      wx.showToast({ title: '补签成功', icon: 'success', duration: 800 });
      this.loadMonth();
    }
  },

  closeRecordDetail() {
    this.setData({ showRecordDetail: false, selectedRecord: null });
  },

  async onRecordImagesChange(e) {
    if (!this.data.selectedRecord) return;
    const newImages = e.detail.images;
    const oldImages = this.data.selectedRecord.images || [];
    imageUtil.cleanOldImages(oldImages, newImages);
    await db.update(db.COLLECTIONS.CHECKIN_RECORD, this.data.selectedRecord._id, { images: newImages });
    const updated = { ...this.data.selectedRecord, images: newImages };
    this.setData({ selectedRecord: updated });
    this.loadMonth();
  },

  async uncheckinDay() {
    if (!this.data.selectedRecord) return;
    const res = await wx.showModal({
      title: '取消打卡',
      content: `确定取消 ${this.data.selectedRecord.date} 的打卡吗？`,
      confirmColor: '#E74C3C'
    });
    if (!res.confirm) return;
    await checkinUtil.uncheckin(this.data.selectedRecord.habitId, this.data.selectedRecord.date);
    wx.showToast({ title: '已取消', icon: 'none', duration: 800 });
    this.setData({ showRecordDetail: false, selectedRecord: null });
    this.loadMonth();
  }
});