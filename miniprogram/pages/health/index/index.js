const tabState = require('../../../utils/tab-state.js');
const ui = require('../../../utils/interaction.js');
const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');
const theme = require('../../../utils/theme.js');

const TABS_ALL = [
  { key: 'overview', label: '概览', icon: 'note' },
  { key: 'height', label: '身高', icon: 'ruler' },
  { key: 'weight', label: '体重', icon: 'scale' },
  { key: 'bp', label: '血压', icon: 'heart' },
  { key: 'heart_rate', label: '心率', icon: 'heart' },
  { key: 'glucose', label: '血糖', icon: 'health' },
  { key: 'oxygen', label: '血氧', icon: 'health' },
  { key: 'temperature', label: '体温', icon: 'temperature' },
  { key: 'water', label: '饮水', icon: 'health' },
  { key: 'sleep', label: '睡眠', icon: 'sleep' },
  { key: 'exercise', label: '运动', icon: 'sport' },
  { key: 'uric_acid', label: '尿酸', icon: 'test' },
  { key: 'cholesterol', label: '血脂', icon: 'test' },
  { key: 'diet', label: '饮食', icon: 'food' },
  { key: 'medication', label: '用药', icon: 'medicine' },
  { key: 'visit', label: '看诊', icon: 'hospital' },
  { key: 'period', label: '生理期', icon: 'flower' }
];

Page({
  behaviors: [tabState.behavior],
  data: {
    profiles: [],
    activeProfileId: '',
    current: null,
    genderLabel: '',
    age: '',
    bmiValue: '',
    bmiStatus: '',
    isFemale: false,
    tabs: [],
    activeTab: 'overview',
    profileActiveTabs: {},

    meds: [], medGroups: [], medCount: 0, todayMeds: [],
    visits: [], visitGroups: [], visitCount: 0,
    periods: [], periodCount: 0, cycleInfo: null, cycleStageText: '', cycleStageClass: '',

    heights: [], heightGroups: [], heightCount: 0,
    heightFirst: null, heightLast: null, heightDiff: null,
    heightDays: 90, heightStats: null,

    weights: [], weightGroups: [], weightCount: 0,
    weightFirst: null, weightLast: null, weightDiff: null,
    weightDays: 30, weightStats: null,
    trendDelta: null,

    bps: [], bpGroups: [], bpCount: 0,
    bpLatest: null, bpStatus: null,
    bpDays: 14, bpStats: null,

    glucoses: [], glucoseGroups: [], glucoseCount: 0,
    glucoseLatest: null, glucoseStatus: null,
    glucoseDays: 30, glucoseStats: null,

    oxygens: [], oxygenGroups: [], oxygenCount: 0,
    oxygenLatest: null, oxygenStatus: null,
    oxygenDays: 14, oxygenStats: null,

    temperatures: [], temperatureGroups: [], temperatureCount: 0,
    tempLatest: null, tempStatus: null,
    tempDays: 14, tempStats: null,

    uricAcids: [], uricGroups: [], uricCount: 0,
    uricLatest: null, uricStatus: null,
    uricDays: 90, uricStats: null,

    cholesterols: [], cholGroups: [], cholCount: 0,
    cholLatest: null, cholStatus: null,
    cholDays: 90, cholStats: null,

    heartRates: [], heartRateGroups: [], heartRateCount: 0,
    heartRateLatest: null, heartRateStatus: null,
    heartRateDays: 14, heartRateStats: null,

    diets: [], dietGroups: [], dietCount: 0,
    dietToday: 0, dietDaily: [], dietDays: 30,

    waters: [], waterCount: 0, waterToday: 0, waterGoal: 2000,
    sleeps: [], sleepCount: 0, sleepStats: null,
    exercises: [], exerciseCount: 0
  },

  onLoad() {},

  onShow() { this.loadAll(); },

  onReady() { setTimeout(() => this._drawCharts(), 200); },

  async loadAll() {
    try {
      const profiles = await db.list(db.COLLECTIONS.HEALTH_PROFILE, { key: 'createdAt', order: 'desc' });
      if (profiles.length === 0) {
        this.setData({ profiles: [], activeProfileId: '', current: null });
        return;
      }
      for (const p of profiles) {
        p._age = healthUtil.calcAge(p.birthDate);
        const bmi = healthUtil.calcBMI(p.height, p.weight);
        p._bmiStr = bmi ? bmi.value + ' · ' + bmi.status : '--';
        p._genderLabel = (healthUtil.GENDER_OPTIONS.find(g => g.value === p.gender) || {}).label || '';
        p._isFemale = p.gender === 'female';
      }
      const stayId = this.data.activeProfileId;
      const activeId = profiles.find(p => p._id === stayId) ? stayId : profiles[0]._id;
      this.setData({ profiles, activeProfileId: activeId });
      this.loadCurrent(activeId);
    } catch (err) {
      ui.toast('加载失败', 'none');
    }
  },

  async loadCurrent(id) {
    const profile = this.data.profiles.find(p => p._id === id);
    if (!profile) return;

    const g = healthUtil.GENDER_OPTIONS.find(o => o.value === profile.gender);
    const age = healthUtil.calcAge(profile.birthDate);
    const bmi = healthUtil.calcBMI(profile.height, profile.weight);
    const isFemale = profile.gender === 'female';
    const targets = profile.targets || null;

    let tabs = TABS_ALL.slice();
    if (!isFemale) tabs = tabs.filter(t => t.key !== 'period');
    const enabled = profile.enabledTabs;
    if (Array.isArray(enabled) && enabled.length > 0) {
      tabs = tabs.filter(t => t.key === 'overview' || enabled.indexOf(t.key) >= 0);
    }
    const enabledTabsView = (Array.isArray(enabled) && enabled.length > 0)
      ? enabled
      : healthUtil.HEALTH_TAB_OPTIONS.map(t => t.key);
    const rememberedTab = this.data.profileActiveTabs[id];
    const activeTab = (rememberedTab && tabs.find(t => t.key === rememberedTab)) ? rememberedTab : 'overview';

    const listAll = (coll) => db.list(coll, { key: 'createdAt', order: 'desc' });
    const colls = [
      db.COLLECTIONS.HEALTH_MEDICATION, db.COLLECTIONS.HEALTH_VISIT,
      db.COLLECTIONS.HEALTH_PERIOD, db.COLLECTIONS.HEALTH_WEIGHT,
      db.COLLECTIONS.HEALTH_BP, db.COLLECTIONS.HEALTH_GLUCOSE,
      db.COLLECTIONS.HEALTH_OXYGEN, db.COLLECTIONS.HEALTH_TEMPERATURE,
      db.COLLECTIONS.HEALTH_URIC_ACID, db.COLLECTIONS.HEALTH_CHOLESTEROL,
      db.COLLECTIONS.HEALTH_WATER, db.COLLECTIONS.HEALTH_SLEEP,
      db.COLLECTIONS.HEALTH_EXERCISE, db.COLLECTIONS.HEALTH_HEIGHT,
      db.COLLECTIONS.HEALTH_HEART_RATE, db.COLLECTIONS.HEALTH_DIET
    ];
    const allRes = await Promise.all(colls.map(c => listAll(c)));

    const meds = allRes[0].filter(m => m.profileId === id);
    const visits = allRes[1].filter(v => v.profileId === id);
    const periods = allRes[2].filter(p => p.profileId === id);
    const weights = allRes[3].filter(w => w.profileId === id).sort((a, b) => (a.date < b.date ? -1 : 1));
    const bps = allRes[4].filter(b => b.profileId === id).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
    const glucoses = allRes[5].filter(g => g.profileId === id).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
    const oxygens = allRes[6].filter(o => o.profileId === id).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
    const temperatures = allRes[7].filter(t => t.profileId === id).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
    const uricAcids = allRes[8].filter(u => u.profileId === id).sort((a, b) => (a.date < b.date ? -1 : 1));
    const cholesterols = allRes[9].filter(c => c.profileId === id).sort((a, b) => (a.date < b.date ? -1 : 1));
    const waters = allRes[10].filter(w => w.profileId === id);
    const sleeps = allRes[11].filter(s => s.profileId === id).sort((a, b) => (a.date < b.date ? -1 : 1));
    const exercises = allRes[12].filter(e => e.profileId === id).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
    const heights = allRes[13].filter(h => h.profileId === id).sort((a, b) => (a.date < b.date ? -1 : 1));
    const heartRates = allRes[14].filter(h => h.profileId === id).sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
    const diets = allRes[15].filter(d => d.profileId === id).sort((a, b) => (a.date < b.date ? -1 : 1));

    for (const m of meds) { m._dateRange = m.startDate + (m.endDate ? ' ~ ' + m.endDate : ''); }
    const medGroups = healthUtil.groupByDate(meds, 'startDate');

    const today = this.formatToday();
    const todayMeds = meds.filter(m => {
      if (!m.reminderEnabled || !m.reminderTimes) return false;
      return (!m.startDate || m.startDate <= today) && (!m.endDate || m.endDate >= today);
    });
    for (const tm of todayMeds) {
      const times = (tm.reminderTimes || '').split(/[,，\s]+/).filter(Boolean);
      tm._reminderList = times;
    }

    // 修复：看诊 date 是 'YYYY-MM-DD' 业务日期，friendlyTime 按毫秒时间戳算会得到 NaN
    for (const v of visits) {
      v._dateLabel = v.date || '';
      v._title = v.title || '';
      v._visitType = v.visitType || '';
      v._department = v.department || '';
      v._treatment = v.treatment || '';
      v._costText = v.cost != null && v.cost !== '' ? '¥' + Number(v.cost).toFixed(2) : '';
    }
    const visitGroups = healthUtil.groupByDate(visits, 'date');

    for (const p of periods) {
      p._dateRange = p.startDate + (p.endDate ? ' ~ ' + p.endDate : '');
      if (p.startDate && p.endDate) {
        const sd = new Date(p.startDate), ed = new Date(p.endDate);
        p._duration = Math.round((ed - sd) / 86400000) + 1;
      }
    }

    let weightFirst = null, weightLast = null, weightDiff = null;
    if (weights.length > 0) {
      weightFirst = weights[0]; weightLast = weights[weights.length - 1];
      weightDiff = (weightLast.weight - weightFirst.weight).toFixed(1);
    }
    const weightGroups = healthUtil.groupByDate(weights.slice().reverse(), 'date');
    const weightStats = healthUtil.quickStats(weights, 'weight');
    // 体重趋势环比：trendStats(values) 返回 { count, avg, change, trend }，change 为相对上一半周期的变化百分比
    const weightTrend = healthUtil.trendStats && healthUtil.trendStats(weights.map(w => w.weight).filter(v => v != null && v !== ''));
    const trendDelta = weightTrend && weightTrend.count > 0 ? {
      text: (weightTrend.trend === 'up' ? '↑' : weightTrend.trend === 'down' ? '↓' : '·') + Math.abs(weightTrend.change) + '%',
      color: weightTrend.trend === 'up' ? 'var(--danger)' : (weightTrend.trend === 'down' ? 'var(--success)' : 'inherit')
    } : null;

    let heightFirst = null, heightLast = null, heightDiff = null;
    if (heights.length > 0) {
      heightFirst = heights[0]; heightLast = heights[heights.length - 1];
      heightDiff = (heightLast.height - heightFirst.height).toFixed(1);
    }
    const heightGroups = healthUtil.groupByDate(heights.slice().reverse(), 'date');
    const heightStats = healthUtil.calcStats(heights.map(h => h.height).filter(v => v));

    for (const b of bps) {
      const st = healthUtil.judgeBP(b.systolic, b.diastolic, targets);
      b._statusLabel = st.label; b._statusColor = st.color;
      if (b.pulse) {
        const pst = healthUtil.judgePulse(b.pulse);
        b._pulseLabel = pst.label; b._pulseColor = pst.color;
      }
      b._sourceLabel = healthUtil.enumLabel(b.source, healthUtil.BP_SOURCE_OPTIONS);
      const pos = healthUtil.enumLabel(b.bodyPosition, healthUtil.BODY_POSITION_OPTIONS);
      const arm = healthUtil.enumLabel(b.arm, healthUtil.ARM_OPTIONS);
      const meta = [pos, arm, b.isRepeat ? '复测' : ''].filter(Boolean).join(' · ');
      b._measureMeta = meta;
    }
    const bpGroups = healthUtil.groupByDate(bps.slice().reverse(), 'date');
    const bpLatest = bps.length > 0 ? bps[bps.length - 1] : null;
    const bpStatus = bpLatest ? healthUtil.judgeBP(bpLatest.systolic, bpLatest.diastolic, targets) : null;
    const bpStats = healthUtil.quickStats(bps, 'systolic', item => healthUtil.judgeBP(item.systolic, item.diastolic, targets));

    const glucoseTargets = targets ? {
      fastingMax: targets.glucoseFasting,
      postprandialMax: targets.glucosePost
    } : null;
    for (const g of glucoses) {
      const t = healthUtil.GLUCOSE_TYPES.find(x => x.value === g.type);
      g._typeLabel = t ? t.label : '';
      g._mealLabel = healthUtil.enumLabel(g.mealType, healthUtil.MEAL_TYPE_OPTIONS);
      const st = healthUtil.judgeGlucose(g.value, g.type, glucoseTargets);
      g._statusLabel = st.label; g._statusColor = st.color;
    }
    const glucoseGroups = healthUtil.groupByDate(glucoses.slice().reverse(), 'date');
    const glucoseLatest = glucoses.length > 0 ? glucoses[glucoses.length - 1] : null;
    const glucoseStatus = glucoseLatest ? healthUtil.judgeGlucose(glucoseLatest.value, glucoseLatest.type, glucoseTargets) : null;
    const glucoseStats = healthUtil.quickStats(glucoses, 'value', item => healthUtil.judgeGlucose(item.value, item.type, glucoseTargets));

    for (const o of oxygens) {
      const st = healthUtil.judgeOxygen(o.oxygen, o.pulse);
      o._statusLabel = st.label; o._statusColor = st.color;
    }
    const oxygenGroups = healthUtil.groupByDate(oxygens.slice().reverse(), 'date');
    const oxygenLatest = oxygens.length > 0 ? oxygens[oxygens.length - 1] : null;
    const oxygenStatus = oxygenLatest ? healthUtil.judgeOxygen(oxygenLatest.oxygen, oxygenLatest.pulse) : null;
    const oxygenStats = healthUtil.quickStats(oxygens, 'oxygen', item => healthUtil.judgeOxygen(item.oxygen, item.pulse));

    const locMap = { oral: '口腔', ear: '耳温', forehead: '额温', underarm: '腋下', rectal: '直肠' };
    for (const t of temperatures) {
      const st = healthUtil.judgeTemperature(t.temperature, t.location);
      t._statusLabel = st.label; t._statusColor = st.color;
      t._locLabel = locMap[t.location] || '';
    }
    const temperatureGroups = healthUtil.groupByDate(temperatures.slice().reverse(), 'date');
    const tempLatest = temperatures.length > 0 ? temperatures[temperatures.length - 1] : null;
    const tempStatus = tempLatest ? healthUtil.judgeTemperature(tempLatest.temperature, tempLatest.location) : null;
    const tempStats = healthUtil.quickStats(temperatures, 'temperature', item => healthUtil.judgeTemperature(item.temperature, item.location));

    for (const u of uricAcids) {
      const st = healthUtil.judgeUricAcid(u.uricAcid, profile.gender);
      u._statusLabel = st.label; u._statusColor = st.color;
      const ut = healthUtil.GLUCOSE_TYPES.find(x => x.value === (u.type || u.meal));
      u._typeLabel = ut ? ut.label : '';
    }
    const uricGroups = healthUtil.groupByDate(uricAcids.slice().reverse(), 'date');
    const uricLatest = uricAcids.length > 0 ? uricAcids[uricAcids.length - 1] : null;
    const uricStatus = uricLatest ? healthUtil.judgeUricAcid(uricLatest.uricAcid, profile.gender) : null;
    const uricStats = healthUtil.quickStats(uricAcids, 'uricAcid', item => healthUtil.judgeUricAcid(item.uricAcid, profile.gender));

    for (const c of cholesterols) {
      const st = healthUtil.judgeCholesterol(c.total, c.ldl, c.hdl, c.tg);
      c._statusLabel = st.label; c._statusColor = st.color;
    }
    const cholGroups = healthUtil.groupByDate(cholesterols.slice().reverse(), 'date');
    const cholLatest = cholesterols.length > 0 ? cholesterols[cholesterols.length - 1] : null;
    const cholStatus = cholLatest ? healthUtil.judgeCholesterol(cholLatest.total, cholLatest.ldl, cholLatest.hdl, cholLatest.tg) : null;
    const cholStats = healthUtil.calcStats(cholesterols.map(c => c.total).filter(v => v));
    const cholTgStats = healthUtil.calcStats(cholesterols.map(c => c.tg).filter(v => v));

    for (const hr of heartRates) {
      const st = healthUtil.judgeHeartRate(hr.rate, hr.scene);
      hr._statusLabel = st.label; hr._statusColor = st.color;
      const sc = healthUtil.HEART_RATE_SCENES.find(x => x.value === hr.scene);
      hr._sceneLabel = sc ? sc.label : '';
    }
    const heartRateGroups = healthUtil.groupByDate(heartRates.slice().reverse(), 'date');
    const heartRateLatest = heartRates.length > 0 ? heartRates[heartRates.length - 1] : null;
    const heartRateStatus = heartRateLatest ? healthUtil.judgeHeartRate(heartRateLatest.rate, heartRateLatest.scene) : null;
    const heartRateStats = healthUtil.quickStats(heartRates, 'rate', item => healthUtil.judgeHeartRate(item.rate, item.scene));

    for (const d of diets) {
      const meal = healthUtil.DIET_MEAL_TYPES.find(x => x.value === d.mealType);
      d._mealLabel = meal ? meal.label : '';
      d._mealIcon = meal ? meal.icon : 'food';
    }
    const dietGroups = healthUtil.groupByDate(diets.slice().reverse(), 'date');
    const todayKey = today;
    const dietToday = diets.filter(d => d.date === todayKey).reduce((s, d) => s + (d.calories || 0), 0);
    const dietDaily = healthUtil.sumByDate(diets, 'date', item => item.calories || 0);

    const waterToday = waters.filter(w => w.date === todayKey).reduce((s, w) => s + (w.amount || 0), 0);

    const sleepDurationValues = sleeps.map(s => parseFloat(s.duration)).filter(v => v);
    const sleepStats = healthUtil.calcStats(sleepDurationValues);
    const exerciseDurationValues = exercises.map(e => parseFloat(e.duration)).filter(v => v);
    const exerciseStats = healthUtil.calcStats(exerciseDurationValues);

    const latestPeriod = periods[0] || null;
    let cycleInfo = null, cycleStageText = '', cycleStageClass = '';
    if (isFemale && latestPeriod && latestPeriod.startDate && profile.cycleLength) {
      cycleInfo = healthUtil.calcCycleInfo(latestPeriod.startDate, profile.cycleLength);
      if (cycleInfo) {
if (cycleInfo.stage === 'period') { cycleStageText = '经期中'; cycleStageClass = 'period'; }
    else if (cycleInfo.stage === 'ovulation') { cycleStageText = '排卵日'; cycleStageClass = 'ovulation'; }
    else if (cycleInfo.stage === 'fertile') { cycleStageText = '易孕期'; cycleStageClass = 'fertile'; }
    else { cycleStageText = '安全期'; cycleStageClass = 'safe'; }
      }
    }

    // P2 单位双制式：录入始终用公制存储，展示按档案偏好换算（不改动原始记录，避免污染编辑回显）
    const imperial = (profile.unitSystem || 'metric') === 'imperial';
    const units = imperial
      ? { glucose: 'mg/dL', weight: 'lbs', height: 'in', temperature: '°C' }
      : { glucose: 'mmol/L', weight: 'kg', height: 'cm', temperature: '°C' };
    const conv = (v, from, to) => healthUtil.convertUnit(v, from, to);
    const convertStats = (stats, from, to) => {
      const out = Object.assign({}, stats);
      ['avg', 'min', 'max'].forEach(k => { if (out[k] != null) out[k] = conv(out[k], from, to); });
      return out;
    };
    const glucoseStatsView = convertStats(glucoseStats, 'mmol/L', units.glucose);
    const weightStatsView = convertStats(weightStats, 'kg', units.weight);
    const heightStatsView = convertStats(heightStats, 'cm', units.height);
    const weightLastView = weightLast ? Object.assign({}, weightLast, { weight: conv(weightLast.weight, 'kg', units.weight) }) : null;
    const glucoseLatestView = glucoseLatest ? Object.assign({}, glucoseLatest, { value: conv(glucoseLatest.value, 'mmol/L', units.glucose) }) : null;
    const weightDiffView = weightDiff != null ? conv(Number(weightDiff), 'kg', units.weight) : null;
    // 列表项展示值（原始记录保持公制，编辑回显不受影响）
    weights.forEach(w => { w._displayValue = conv(w.weight, 'kg', units.weight); });
    heights.forEach(h => { h._displayValue = conv(h.height, 'cm', units.height); });
    glucoses.forEach(g => { g._displayValue = conv(g.value, 'mmol/L', units.glucose); });

    this.setData({
      current: profile,
      units,
      genderLabel: g ? g.label : '', age,
      bmiValue: bmi ? bmi.value : '', bmiStatus: bmi ? bmi.status : '',
      isFemale, tabs, activeTab, enabledTabs: enabledTabsView,
      meds, medGroups, medCount: meds.length, todayMeds,
      visits, visitGroups, visitCount: visits.length,
      periods, periodCount: periods.length,
      heights, heightGroups, heightCount: heights.length,
      heightFirst, heightLast, heightDiff, heightStats: heightStatsView,
      weights, weightGroups, weightCount: weights.length,
      weightFirst, weightLast: weightLastView, weightDiff: weightDiffView, weightStats: weightStatsView,
      trendDelta,
      bps, bpGroups, bpCount: bps.length, bpLatest, bpStatus, bpStats,
      glucoses, glucoseGroups, glucoseCount: glucoses.length,
      glucoseLatest: glucoseLatestView, glucoseStatus, glucoseStats: glucoseStatsView,
      oxygens, oxygenGroups, oxygenCount: oxygens.length,
      oxygenLatest, oxygenStatus, oxygenStats,
      temperatures, temperatureGroups, temperatureCount: temperatures.length,
      tempLatest, tempStatus, tempStats,
      uricAcids, uricGroups, uricCount: uricAcids.length,
      uricLatest, uricStatus, uricStats,
      cholesterols, cholGroups, cholCount: cholesterols.length,
      cholLatest, cholStatus, cholStats, cholTgStats,
      heartRates, heartRateGroups, heartRateCount: heartRates.length,
      heartRateLatest, heartRateStatus, heartRateStats,
      diets, dietGroups, dietCount: diets.length, dietToday, dietDaily,
      waters, waterCount: waters.length, waterToday, waterGoal: profile.waterGoal || 2000,
      sleeps, sleepCount: sleeps.length, sleepStats,
      exercises, exerciseCount: exercises.length, exerciseStats,
      cycleInfo, cycleStageText, cycleStageClass
    });

    setTimeout(() => this._drawCharts(), 100);
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  _drawCharts() {
    const tab = this.data.activeTab;
    const p = theme.getChartPalette();
    const fill = c => theme.hexToRgba(c, 0.15);
    const map = {
      height: { id: 'heightChart', data: this.data.heights, df: 'date', vf: 'height', days: this.data.heightDays, lc: p.primary, fc: fill(p.primary) },
      weight: { id: 'weightChart', data: this.data.weights, df: 'date', vf: 'weight', days: this.data.weightDays, lc: p.health, fc: fill(p.health) },
      bp: { id: 'bpChart', data: this.data.bps, df: 'date', vf: i => i.systolic, days: this.data.bpDays, lc: p.danger, fc: fill(p.danger) },
      glucose: { id: 'glucoseChart', data: this.data.glucoses, df: 'date', vf: 'value', days: this.data.glucoseDays, lc: p.warning, fc: fill(p.warning) },
      oxygen: { id: 'oxygenChart', data: this.data.oxygens, df: 'date', vf: 'oxygen', days: this.data.oxygenDays, lc: p.series[4], fc: fill(p.series[4]) },
      temperature: { id: 'tempChart', data: this.data.temperatures, df: 'date', vf: 'temperature', days: this.data.tempDays, lc: p.warningDark, fc: fill(p.warningDark) },
      uric_acid: { id: 'uricChart', data: this.data.uricAcids, df: 'date', vf: 'uricAcid', days: this.data.uricDays, lc: p.series[3], fc: fill(p.series[3]) },
      cholesterol: { id: 'cholChart', data: this.data.cholesterols, df: 'date', vf: 'total', days: this.data.cholDays, lc: p.primaryDark, fc: fill(p.primaryDark) },
      heart_rate: { id: 'heartRateChart', data: this.data.heartRates, df: 'date', vf: 'rate', days: this.data.heartRateDays, lc: p.danger, fc: fill(p.danger) },
      diet: { id: 'dietChart', data: this.data.dietDaily, df: 'date', vf: 'value', days: this.data.dietDays, lc: p.warning, fc: fill(p.warning) },
      sleep: { id: 'sleepChart', data: this.data.sleeps, df: 'date', vf: 'duration', days: 14, lc: p.series[3], fc: fill(p.series[3]) },
      exercise: { id: 'exerciseChart', data: this.data.exercises, df: 'date', vf: 'duration', days: 14, lc: p.success, fc: fill(p.success) }
    };
    if (map[tab]) {
      const m = map[tab];
      if (m.data && m.data.length > 0) {
        const points = healthUtil.buildChartPoints(m.data, m.df, m.vf, m.days);
        this._drawCanvas(m.id, points, { lineColor: m.lc, fillColor: m.fc });
      }
    }
  },

  _drawCanvas(id, points, opts) {
    const query = wx.createSelectorQuery();
    query.select('#' + id).fields({ node: true, size: true }).exec(res => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const w = res[0].width, h = res[0].height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      healthUtil.drawLineChart(ctx, points, { width: w, height: h, ...opts });
    });
  },

  switchProfile(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeProfileId) return;
    this.setData({ activeProfileId: id });
    this.loadCurrent(id);
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    const map = Object.assign({}, this.data.profileActiveTabs);
    map[this.data.activeProfileId] = key;
    this.setData({ activeTab: key, profileActiveTabs: map });
    setTimeout(() => this._drawCharts(), 100);
  },

  goCreate() { wx.navigateTo({ url: '/pages/health/profile/edit' }); },
  goEditProfile() { wx.navigateTo({ url: `/pages/health/profile/edit?id=${this.data.activeProfileId}` }); },
  goProfileDetail() {
    const id = this.data.activeProfileId;
    if (!id) {
      ui.toast('请先选择健康档案', 'none');
      return;
    }
    wx.navigateTo({ url: `/pages/health/profile/detail?id=${id}` });
  },

  addHeight() { wx.navigateTo({ url: `/pages/health/height/edit?profileId=${this.data.activeProfileId}` }); },
  editHeight(e) { wx.navigateTo({ url: `/pages/health/height/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteHeight(e) { await this._deleteHelper('身高记录', db.COLLECTIONS.HEALTH_HEIGHT, e.currentTarget.dataset.id); },

  addWeight() { wx.navigateTo({ url: `/pages/health/weight/edit?profileId=${this.data.activeProfileId}` }); },
  editWeight(e) { wx.navigateTo({ url: `/pages/health/weight/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteWeight(e) { await this._deleteHelper('体重记录', db.COLLECTIONS.HEALTH_WEIGHT, e.currentTarget.dataset.id); },

  addBP() { wx.navigateTo({ url: `/pages/health/bp/edit?profileId=${this.data.activeProfileId}` }); },
  editBP(e) { wx.navigateTo({ url: `/pages/health/bp/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteBP(e) { await this._deleteHelper('血压记录', db.COLLECTIONS.HEALTH_BP, e.currentTarget.dataset.id); },

  addGlucose() { wx.navigateTo({ url: `/pages/health/glucose/edit?profileId=${this.data.activeProfileId}` }); },
  editGlucose(e) { wx.navigateTo({ url: `/pages/health/glucose/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteGlucose(e) { await this._deleteHelper('血糖记录', db.COLLECTIONS.HEALTH_GLUCOSE, e.currentTarget.dataset.id); },

  addOxygen() { wx.navigateTo({ url: `/pages/health/oxygen/edit?profileId=${this.data.activeProfileId}` }); },
  editOxygen(e) { wx.navigateTo({ url: `/pages/health/oxygen/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteOxygen(e) { await this._deleteHelper('血氧记录', db.COLLECTIONS.HEALTH_OXYGEN, e.currentTarget.dataset.id); },

  addTemperature() { wx.navigateTo({ url: `/pages/health/temperature/edit?profileId=${this.data.activeProfileId}` }); },
  editTemperature(e) { wx.navigateTo({ url: `/pages/health/temperature/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteTemperature(e) { await this._deleteHelper('体温记录', db.COLLECTIONS.HEALTH_TEMPERATURE, e.currentTarget.dataset.id); },

  addUric() { wx.navigateTo({ url: `/pages/health/uric_acid/edit?profileId=${this.data.activeProfileId}` }); },
  editUric(e) { wx.navigateTo({ url: `/pages/health/uric_acid/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteUric(e) { await this._deleteHelper('尿酸记录', db.COLLECTIONS.HEALTH_URIC_ACID, e.currentTarget.dataset.id); },

  addChol() { wx.navigateTo({ url: `/pages/health/cholesterol/edit?profileId=${this.data.activeProfileId}` }); },
  editChol(e) { wx.navigateTo({ url: `/pages/health/cholesterol/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteChol(e) { await this._deleteHelper('血脂记录', db.COLLECTIONS.HEALTH_CHOLESTEROL, e.currentTarget.dataset.id); },

  addHeartRate() { wx.navigateTo({ url: `/pages/health/heart_rate/edit?profileId=${this.data.activeProfileId}` }); },
  editHeartRate(e) { wx.navigateTo({ url: `/pages/health/heart_rate/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteHeartRate(e) { await this._deleteHelper('心率记录', db.COLLECTIONS.HEALTH_HEART_RATE, e.currentTarget.dataset.id); },

  addDiet() { wx.navigateTo({ url: `/pages/health/diet/edit?profileId=${this.data.activeProfileId}` }); },
  editDiet(e) { wx.navigateTo({ url: `/pages/health/diet/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteDiet(e) { await this._deleteHelper('饮食记录', db.COLLECTIONS.HEALTH_DIET, e.currentTarget.dataset.id); },

  goWater() { wx.navigateTo({ url: `/pages/health/water/index?profileId=${this.data.activeProfileId}` }); },
  goSleep() { wx.navigateTo({ url: `/pages/health/sleep/index?profileId=${this.data.activeProfileId}` }); },
  goExercise() { wx.navigateTo({ url: `/pages/health/exercise/index?profileId=${this.data.activeProfileId}` }); },

  addWater() { wx.navigateTo({ url: `/pages/health/water/edit?profileId=${this.data.activeProfileId}` }); },

  // 概览饮水卡快捷加入：按 water/edit.js 的记录结构写入今日 250ml，并刷新概览
  async quickAddWater() {
    const profileId = this.data.activeProfileId;
    if (!profileId) { ui.toast('请先选择健康档案', 'none'); return; }
    const d = new Date();
    const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    try {
      await db.add(db.COLLECTIONS.HEALTH_WATER, {
        profileId,
        date,
        time,
        amount: 250,
        notes: '',
        note: '',
        updatedAt: Date.now()
      });
      ui.toast('已快捷加入 250ml');
      this.loadCurrent(profileId);
    } catch (err) {
      ui.toast('加入失败', 'none');
    }
  },
  addSleep() { wx.navigateTo({ url: `/pages/health/sleep/edit?profileId=${this.data.activeProfileId}` }); },
  addExercise() { wx.navigateTo({ url: `/pages/health/exercise/edit?profileId=${this.data.activeProfileId}` }); },

  addMed() { wx.navigateTo({ url: `/pages/health/medication/edit?profileId=${this.data.activeProfileId}` }); },
  editMed(e) { wx.navigateTo({ url: `/pages/health/medication/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteMed(e) { await this._deleteHelper('用药记录', db.COLLECTIONS.HEALTH_MEDICATION, e.currentTarget.dataset.id); },

  addVisit() { wx.navigateTo({ url: `/pages/health/visit/edit?profileId=${this.data.activeProfileId}` }); },
  editVisit(e) { wx.navigateTo({ url: `/pages/health/visit/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deleteVisit(e) { await this._deleteHelper('看诊记录', db.COLLECTIONS.HEALTH_VISIT, e.currentTarget.dataset.id); },

  addPeriod() { wx.navigateTo({ url: `/pages/health/period/edit?profileId=${this.data.activeProfileId}` }); },
  editPeriod(e) { wx.navigateTo({ url: `/pages/health/period/edit?profileId=${this.data.activeProfileId}&id=${e.currentTarget.dataset.id}` }); },
  async deletePeriod(e) { await this._deleteHelper('生理期记录', db.COLLECTIONS.HEALTH_PERIOD, e.currentTarget.dataset.id); },

  async _deleteHelper(title, coll, id) {
    const res = await ui.confirmDeleteLegacy()
    if (!res.confirm) return;
    await db.remove(coll, id);
    ui.toast('已删除');
    this.loadCurrent(this.data.activeProfileId);
  },

  async deleteProfile(e) {
    const { id, name } = e.currentTarget.dataset;
    const res = await ui.confirmDeleteLegacy({ title: '删除档案', content: `确定删除「${name}」的健康档案吗？所有关联记录也会一并删除。` })
    if (!res.confirm) return;

    await db.remove(db.COLLECTIONS.HEALTH_PROFILE, id);
    const allColls = [
      db.COLLECTIONS.HEALTH_MEDICATION, db.COLLECTIONS.HEALTH_VISIT,
      db.COLLECTIONS.HEALTH_PERIOD, db.COLLECTIONS.HEALTH_WEIGHT,
      db.COLLECTIONS.HEALTH_BP, db.COLLECTIONS.HEALTH_GLUCOSE,
      db.COLLECTIONS.HEALTH_OXYGEN, db.COLLECTIONS.HEALTH_TEMPERATURE,
      db.COLLECTIONS.HEALTH_URIC_ACID, db.COLLECTIONS.HEALTH_CHOLESTEROL,
      db.COLLECTIONS.HEALTH_WATER, db.COLLECTIONS.HEALTH_SLEEP,
      db.COLLECTIONS.HEALTH_EXERCISE, db.COLLECTIONS.HEALTH_HEIGHT,
      db.COLLECTIONS.HEALTH_HEART_RATE, db.COLLECTIONS.HEALTH_DIET
    ];
    const promises = allColls.map(coll =>
      db.query(coll, { profileId: id }).then(list =>
        Promise.all(list.map(r => db.remove(coll, r._id)))
      )
    );
    await Promise.all(promises);
    ui.toast('已删除');
    this.setData({ activeProfileId: '' });
    this.loadAll();
  },

  setChartDays(e) {
    const tabKey = e.currentTarget.dataset.tab;
    const days = parseInt(e.currentTarget.dataset.d);
    const map = {
      height: 'heightDays', weight: 'weightDays', bp: 'bpDays', glucose: 'glucoseDays',
      oxygen: 'oxygenDays', temperature: 'tempDays',
      uric_acid: 'uricDays', cholesterol: 'cholDays',
      heart_rate: 'heartRateDays', diet: 'dietDays'
    };
    const dataKey = map[tabKey];
    if (dataKey) {
      this.setData({ [dataKey]: days });
      setTimeout(() => this._drawCharts(), 50);
    }
  }
});