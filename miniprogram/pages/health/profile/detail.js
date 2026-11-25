const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const healthUtil = require('../../../utils/health.js');

const TABS = [
  { key: 'overview', label: '概览', icon: '📋' },
  { key: 'medication', label: '用药', icon: '💊' },
  { key: 'visit', label: '看诊', icon: '🏥' },
  { key: 'period', label: '生理期', icon: '🌸' }
];

Page({
  data: {
    id: '',
    profile: null,
    tabs: TABS,
    activeTab: 'overview',
    age: '',
    bmiValue: '',
    bmiStatus: '',
    genderLabel: '',
    isFemale: false,

    meds: [],
    medGroups: [],
    medCount: 0,
    latestMed: null,

    visits: [],
    visitGroups: [],
    visitCount: 0,
    latestVisit: null,

    periods: [],
    periodCount: 0,
    latestPeriod: null,
    cycleInfo: null
  },

  onLoad(options) {
    this.setData({ id: options.id });
  },

  onShow() {
    this.loadAll();
  },

  async loadAll() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, this.data.id);
      if (!profile) {
        wx.showToast({ title: '档案不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1000);
        wx.hideLoading();
        return;
      }

      const age = healthUtil.calcAge(profile.birthDate);
      const bmi = healthUtil.calcBMI(profile.height, profile.weight);
      const g = healthUtil.GENDER_OPTIONS.find(o => o.value === profile.gender);

      const [meds, visits, periods] = await Promise.all([
        db.list(db.COLLECTIONS.HEALTH_MEDICATION, { key: 'startDate', order: 'desc' }),
        db.list(db.COLLECTIONS.HEALTH_VISIT, { key: 'date', order: 'desc' }),
        db.list(db.COLLECTIONS.HEALTH_PERIOD, { key: 'startDate', order: 'desc' })
      ]);

      const myMeds = meds.filter(m => m.profileId === this.data.id);
      const myVisits = visits.filter(v => v.profileId === this.data.id);
      const myPeriods = periods.filter(p => p.profileId === this.data.id);

      for (const m of myMeds) {
        m._dateRange = m.startDate + (m.endDate ? ' ~ ' + m.endDate : '');
      }
      const medGroups = healthUtil.groupByDate(myMeds, 'startDate');
      
      for (const v of myVisits) {
        v._dateLabel = dateUtil.friendlyTime(v.date);
      }
      const visitGroups = healthUtil.groupByDate(myVisits, 'date');
      
      for (const p of myPeriods) {
        p._dateRange = p.startDate + (p.endDate ? ' ~ ' + p.endDate : '');
        if (p.startDate && p.endDate) {
          const sd = new Date(p.startDate);
          const ed = new Date(p.endDate);
          p._duration = Math.round((ed - sd) / 86400000) + 1;
        }
      }

      const latestPeriod = myPeriods[0] || null;
      let cycleInfo = null;
      let cycleStageText = '';
      let cycleStageClass = '';
      if (profile.gender === 'female' && latestPeriod && latestPeriod.startDate && profile.cycleLength) {
        cycleInfo = healthUtil.calcCycleInfo(latestPeriod.startDate, profile.cycleLength);
        if (cycleInfo) {
          if (cycleInfo.stage === 'period') { cycleStageText = '🩸 经期中'; cycleStageClass = 'period'; }
          else if (cycleInfo.stage === 'ovulation') { cycleStageText = '🌟 排卵日'; cycleStageClass = 'ovulation'; }
          else if (cycleInfo.stage === 'fertile') { cycleStageText = '💚 易孕期'; cycleStageClass = 'fertile'; }
          else { cycleStageText = '💙 安全期'; cycleStageClass = 'safe'; }
        }
      }

      this.setData({
        profile,
        age,
        bmiValue: bmi ? bmi.value : '',
        bmiStatus: bmi ? bmi.status : '',
        genderLabel: g ? g.label : '',
        isFemale: profile.gender === 'female',
        tabs: profile.gender === 'female' ? TABS : TABS.filter(t => t.key !== 'period'),
        meds: myMeds,
        medGroups,
        medCount: myMeds.length,
        latestMed: myMeds[0] || null,
        visits: myVisits,
        visitGroups,
        visitCount: myVisits.length,
        latestVisit: myVisits[0] || null,
        periods: myPeriods,
        periodCount: myPeriods.length,
        latestPeriod,
        cycleInfo,
        cycleStageText,
        cycleStageClass,
        activeTab: this.data.activeTab === 'period' && profile.gender !== 'female' ? 'overview' : this.data.activeTab
      });

      wx.setNavigationBarTitle({ title: profile.name + '的档案' });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
  },

  goEditProfile() {
    wx.navigateTo({ url: `/pages/health/profile/edit?id=${this.data.id}` });
  },

  addMed() {
    wx.navigateTo({ url: `/pages/health/medication/edit?profileId=${this.data.id}` });
  },

  editMed(e) {
    wx.navigateTo({ url: `/pages/health/medication/edit?profileId=${this.data.id}&id=${e.currentTarget.dataset.id}` });
  },

  async deleteMed(e) {
    const { id } = e.currentTarget.dataset;
    const res = await wx.showModal({ title: '删除用药记录', content: '确认删除？', confirmColor: '#E74C3C' });
    if (!res.confirm) return;
    await db.remove(db.COLLECTIONS.HEALTH_MEDICATION, id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadAll();
  },

  addVisit() {
    wx.navigateTo({ url: `/pages/health/visit/edit?profileId=${this.data.id}` });
  },

  editVisit(e) {
    wx.navigateTo({ url: `/pages/health/visit/edit?profileId=${this.data.id}&id=${e.currentTarget.dataset.id}` });
  },

  async deleteVisit(e) {
    const { id } = e.currentTarget.dataset;
    const res = await wx.showModal({ title: '删除看诊记录', content: '确认删除？', confirmColor: '#E74C3C' });
    if (!res.confirm) return;
    await db.remove(db.COLLECTIONS.HEALTH_VISIT, id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadAll();
  },

  addPeriod() {
    wx.navigateTo({ url: `/pages/health/period/edit?profileId=${this.data.id}` });
  },

  editPeriod(e) {
    wx.navigateTo({ url: `/pages/health/period/edit?profileId=${this.data.id}&id=${e.currentTarget.dataset.id}` });
  },

  async deletePeriod(e) {
    const { id } = e.currentTarget.dataset;
    const res = await wx.showModal({ title: '删除生理期记录', content: '确认删除？', confirmColor: '#E74C3C' });
    if (!res.confirm) return;
    await db.remove(db.COLLECTIONS.HEALTH_PERIOD, id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadAll();
  }
});