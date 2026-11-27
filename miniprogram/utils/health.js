/**
 * 健康模块公共数据契约（v1）
 * 目标：把值域、判读阈值、单位、枚举口径集中到一处，避免每个编辑页各写一套。
 * 注意：判读阈值仅用于记录参考，不构成医疗诊断依据。
 */
const JUDGE_VERSION = '2026.11-v1';
const MEDICAL_DISCLAIMER = '非医疗器械，仅供记录参考，不构成诊疗依据';
const theme = require('./theme.js');

// 统一枚举形态：{ value, label }。老数据的中文字符串由 normalizeEnum 兼容。
const BP_SOURCE_OPTIONS = [
  { value: 'manual', label: '手动测量' },
  { value: 'device', label: '电子血压计' },
  { value: 'wearable', label: '手环/手表' },
  { value: 'hospital', label: '医院测量' }
];
// 血氧采集设备与血压不同：指夹仪是血氧常见设备，保留 fingertip 兼容历史数据。
// 不与 BP_SOURCE_OPTIONS 共用，避免血氧页出现「电子血压计」这种错语义标签。
const OXYGEN_SOURCE_OPTIONS = [
  { value: 'manual', label: '手动测量' },
  { value: 'fingertip', label: '指夹血氧仪' },
  { value: 'device', label: '家用检测仪' },
  { value: 'wearable', label: '手环/手表' },
  { value: 'hospital', label: '医院测量' }
];
const BODY_POSITION_OPTIONS = [
  { value: 'sitting', label: '坐位' },
  { value: 'lying', label: '卧位' },
  { value: 'standing', label: '站位' }
];
const ARM_OPTIONS = [
  { value: 'left', label: '左臂' },
  { value: 'right', label: '右臂' }
];
const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' }
];
const SPECIMEN_OPTIONS = [
  { value: 'capillary', label: '指尖血' },
  { value: 'interstitial', label: '间质液(CGM)' },
  { value: 'plasma', label: '静脉血浆' }
];
const OXYGEN_SCENE_OPTIONS = [
  { value: 'resting', label: '静息' },
  { value: 'exercise', label: '运动中' },
  { value: 'sleep', label: '睡眠中' },
  { value: 'random', label: '随机' }
];

// 数值字段合法值域。key 同时作为编辑页 save() 校验入口。
const VITAL_RANGES = {
  systolic: { min: 50, max: 300, label: '收缩压', unit: 'mmHg' },
  diastolic: { min: 30, max: 200, label: '舒张压', unit: 'mmHg' },
  pulse: { min: 30, max: 250, label: '脉搏', unit: 'bpm' },
  glucose: { min: 0.5, max: 50, label: '血糖', unit: 'mmol/L' },
  heartRate: { min: 30, max: 250, label: '心率', unit: 'bpm' },
  oxygen: { min: 0, max: 100, label: '血氧', unit: '%' },
  temperature: { min: 34, max: 43, label: '体温', unit: '°C' },
  weight: { min: 20, max: 300, label: '体重', unit: 'kg' },
  height: { min: 80, max: 250, label: '身高', unit: 'cm' },
  uricAcid: { min: 50, max: 1500, label: '尿酸', unit: 'μmol/L' },
  total: { min: 0.5, max: 30, label: '总胆固醇', unit: 'mmol/L' },
  ldl: { min: 0.1, max: 20, label: '低密度脂蛋白', unit: 'mmol/L' },
  hdl: { min: 0.1, max: 10, label: '高密度脂蛋白', unit: 'mmol/L' },
  tg: { min: 0.1, max: 30, label: '甘油三酯', unit: 'mmol/L' },
  bodyFat: { min: 3, max: 70, label: '体脂率', unit: '%' },
  calories: { min: 0, max: 20000, label: '热量', unit: 'kcal' },
  duration: { min: 0, max: 1440, label: '时长', unit: '分钟' },
  amount: { min: 1, max: 5000, label: '饮水量', unit: 'ml' }
};

// 判读阈值集中管理，带版本号，便于历史记录按当时口径复现。
const JUDGE_THRESHOLDS = {
  version: JUDGE_VERSION,
  bp: { highSys: 140, highDia: 90, warnSys: 120, warnDia: 80, lowSys: 90, lowDia: 60, basis: '常用诊室血压分级阈值（简化）' },
  glucose: { fastingHigh: 7.0, fastingWarn: 6.1, postHigh: 11.1, postWarn: 7.8, randomHigh: 11.1, randomWarn: 7.0, low: 3.9, basis: '常用静脉血浆血糖参考区间（简化）' },
  oxygen: { critical: 90, low: 95, pulseHigh: 100, basis: '常用脉搏血氧饱和度参考区间' },
  temperature: { critical: 39, high: 38.5, warn: 37.3, low: 36, basis: '腋温等效参考区间', offsets: { underarm: 0, oral: 0.5, ear: 0.5, forehead: 0.3, rectal: 0.8 } },
  uricAcid: { maleUpper: 420, femaleUpper: 360, lower: 180, basis: '常用血尿酸参考区间（按性别）' },
  cholesterol: { total: 5.2, ldl: 3.4, hdlLow: 1.0, tgHigh: 2.3, tgWarn: 1.7, basis: '常用血脂参考区间（简化）' },
  heartRate: { high: 100, low: 60, exerciseHigh: 160, exerciseLow: 90, basis: '常用静息/运动心率参考区间' }
};

const GENDER_OPTIONS = [
  { value: 'male', label: '男', icon: 'user' },
  { value: 'female', label: '女', icon: 'user' }
];

const BLOOD_TYPE_OPTIONS = ['A', 'B', 'AB', 'O', 'RH-A', 'RH-B', 'RH-AB', 'RH-O', '未知'];

const AVATAR_PRESETS = [
  'user', 'user', 'user', 'user', 'user', 'user', 'user', 'user', 'user', 'user', 'user', 'user', 'user', 'pets', 'pets', 'pets'
];

const HEALTH_TAB_OPTIONS = [
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

const DEFAULT_ENABLED_TABS = ['weight', 'bp', 'glucose', 'water', 'sleep', 'exercise'];

function calcAge(birthDate) {
  if (!birthDate) return '';
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 ? age : 0;
}

/**
 * 数值校验：返回 { ok, value, message }。空值由调用方决定必填与否，
 * 校验器只负责"有值时是否在合法区间"。
 */
function validateNumber(field, raw) {
  const rule = VITAL_RANGES[field];
  if (raw === '' || raw === null || raw === undefined) {
    return { ok: true, value: null, message: '' };
  }
  const num = Number(raw);
  if (!rule) return { ok: isFinite(num), value: isFinite(num) ? num : null, message: isFinite(num) ? '' : '数值无效' };
  if (!isFinite(num)) return { ok: false, value: null, message: '请输入数字' };
  if (num < rule.min || num > rule.max) {
    return { ok: false, value: null, message: rule.label + '应在 ' + rule.min + '–' + rule.max + ' ' + rule.unit };
  }
  return { ok: true, value: num, message: '' };
}

// 批量校验：fields = [{ field, value, required, label }]，返回第一条错误或 null。
function validateFields(fields) {
  for (const f of fields) {
    const r = validateNumber(f.field, f.value);
    if (!r.ok) return { field: f.field, message: r.message };
    if (f.required && (f.value === '' || f.value === null || f.value === undefined)) {
      return { field: f.field, message: '请填写' + (f.label || VITAL_RANGES[f.field].label) };
    }
  }
  return null;
}

// 给判读结果统一附加版本与免责声明，供各页展示。
function withJudgeMeta(result, basis) {
  if (!result) return result;
  return Object.assign({}, result, {
    version: JUDGE_VERSION,
    basis: basis || '',
    disclaimer: MEDICAL_DISCLAIMER
  });
}

// 老数据枚举兼容：中文字符串 / {value,label} / value 字符串 -> {value,label}
function normalizeEnum(raw, options) {
  if (raw && typeof raw === 'object' && raw.value) {
    return options.find(o => o.value === raw.value) || raw;
  }
  const found = options.find(o => o.value === raw || o.label === raw);
  return found || null;
}

function enumLabel(raw, options) {
  const item = normalizeEnum(raw, options);
  return item ? item.label : (typeof raw === 'string' ? raw : '');
}

// 把任一部位的体温换算为腋温等效值后再判读，解决"录了部位但判读不用"的脱节。
function toUnderarmEquivalent(value, location) {
  const offsets = JUDGE_THRESHOLDS.temperature.offsets;
  const offset = offsets[location] || 0;
  return Number(value) - offset;
}

function calcBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0) return null;
  const h = heightCm / 100;
  const bmi = (weightKg / (h * h)).toFixed(1);
  let status = '正常';
  if (bmi < 18.5) status = '偏瘦';
  else if (bmi < 24) status = '正常';
  else if (bmi < 28) status = '偏胖';
  else status = '肥胖';
  return { value: parseFloat(bmi), status };
}

function formatHeight(height) {
  if (!height) return '';
  if (height < 3) return (height * 100).toFixed(1) + 'cm';
  return height + 'cm';
}

function formatWeight(weight) {
  if (!weight) return '';
  return weight + 'kg';
}

function groupByDate(list, dateField) {
  const groups = {};
  list.forEach(item => {
    const d = item[dateField] || '';
    const key = d.substring(0, 7);
    if (!groups[key]) groups[key] = { month: key, items: [] };
    groups[key].items.push(item);
  });
  return Object.values(groups).sort((a, b) => (a.month < b.month ? 1 : -1));
}

function monthLabel(monthStr) {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length === 2) return parts[0] + '年' + parseInt(parts[1]) + '月';
  return monthStr;
}

const CYCLE_STAGES = [
  { key: 'period', label: '经期', color: '#E91E63', icon: 'health' },
  { key: 'ovulation', label: '排卵日', color: '#FF9800', icon: 'star' },
  { key: 'fertile', label: '易孕期', color: '#4CAF50', icon: 'health' },
  { key: 'safe', label: '安全期', color: '#2196F3', icon: 'health' }
];

function calcCycleInfo(lastPeriodStart, cycleLength) {
  if (!lastPeriodStart) return null;
  const cycleDays = cycleLength || 28;
  const start = new Date(lastPeriodStart + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  if (diff < 0) return null;
  const dayInCycle = (diff % cycleDays) + 1;

  let stage = 'safe';
  if (dayInCycle <= 5) stage = 'period';
  else if (dayInCycle >= cycleDays - 14 && dayInCycle <= cycleDays - 10) stage = 'fertile';
  else if (dayInCycle === cycleDays - 14) stage = 'ovulation';

  const nextPeriodStart = new Date(start.getTime() + cycleDays * 86400000);
  const daysUntilNext = Math.ceil((nextPeriodStart - today) / 86400000);

  return {
    dayInCycle,
    totalDays: cycleDays,
    stage,
    daysUntilNext,
    nextPeriod: nextPeriodStart.getFullYear() + '-' +
      String(nextPeriodStart.getMonth() + 1).padStart(2, '0') + '-' +
      String(nextPeriodStart.getDate()).padStart(2, '0')
  };
}

function judgeBP(sys, dia, targets) {
  const t = JUDGE_THRESHOLDS.bp;
  if (!sys || !dia) return withJudgeMeta({ label: '数据不足', level: 'none', color: '#999999' }, t.basis);
  const highSys = targets && targets.bpSys ? Number(targets.bpSys) : t.highSys;
  const highDia = targets && targets.bpDia ? Number(targets.bpDia) : t.highDia;
  if (sys >= highSys || dia >= highDia) return withJudgeMeta({ label: '超出个人目标', level: 'high', color: '#E74C3C' }, targets ? '个人目标区间' : t.basis);
  if (sys >= t.warnSys || dia >= t.warnDia) return withJudgeMeta({ label: '偏高', level: 'warn', color: '#F39C12' }, t.basis);
  if (sys < t.lowSys || dia < t.lowDia) return withJudgeMeta({ label: '低血压', level: 'low', color: '#3498DB' }, t.basis);
  return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
}

const GLUCOSE_TYPES = [
  { value: 'fasting', label: '空腹' },
  { value: 'postprandial', label: '餐后2h' },
  { value: 'random', label: '随机' },
  { value: 'before_bed', label: '睡前' }
];

const HEART_RATE_SCENES = [
  { value: 'resting', label: '静息' },
  { value: 'morning', label: '晨起' },
  { value: 'exercise', label: '运动后' },
  { value: 'during_exercise', label: '运动中' },
  { value: 'sleep', label: '睡眠' },
  { value: 'random', label: '随机' }
];

const DIET_MEAL_TYPES = [
  { value: 'breakfast', label: '早餐', icon: 'breakfast' },
  { value: 'lunch', label: '午餐', icon: 'lunch' },
  { value: 'dinner', label: '晚餐', icon: 'dinner' },
  { value: 'snack', label: '加餐', icon: 'snack' }
];

function judgeGlucose(value, type, targets) {
  const t = JUDGE_THRESHOLDS.glucose;
  if (!value) return withJudgeMeta({ label: '数据不足', level: 'none', color: '#999999' }, t.basis);
  const num = Number(value);
  // 个人目标区间优先：targets = { fastingMax, postprandialMax }（P2 用户自定义）
  const fastingHigh = targets && targets.fastingMax ? Number(targets.fastingMax) : t.fastingHigh;
  const fastingWarn = targets && targets.fastingWarn ? Number(targets.fastingWarn) : t.fastingWarn;
  const postHigh = targets && targets.postprandialMax ? Number(targets.postprandialMax) : t.postHigh;
  const postWarn = targets && targets.postprandialWarn ? Number(targets.postprandialWarn) : t.postWarn;
  let level = 'normal';
  let label = '正常';
  if (type === 'fasting') {
    if (num >= fastingHigh) { level = 'high'; label = '明显偏高'; }
    else if (num >= fastingWarn) { level = 'warn'; label = '空腹偏高'; }
    else if (num < t.low) { level = 'low'; label = '偏低'; }
  } else if (type === 'postprandial') {
    if (num >= postHigh) { level = 'high'; label = '餐后明显偏高'; }
    else if (num >= postWarn) { level = 'warn'; label = '餐后偏高'; }
    else if (num < t.low) { level = 'low'; label = '偏低'; }
  } else {
    if (num >= t.randomHigh) { level = 'high'; label = '明显偏高'; }
    else if (num >= t.randomWarn) { level = 'warn'; label = '偏高'; }
    else if (num < t.low) { level = 'low'; label = '偏低'; }
  }
  const colorMap = { high: '#E74C3C', warn: '#F39C12', low: '#3498DB', normal: '#27AE60', none: '#999999' };
  return withJudgeMeta({ label, level, color: colorMap[level] }, t.basis);
}

function buildChartPoints(list, dateField, valueField, days) {
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400000);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getTime() + 86400000);
  end.setHours(0, 0, 0, 0);

  const filtered = list.filter(item => {
    const d = new Date(item[dateField] + 'T00:00:00');
    return d >= start && d < end;
  });

  const map = {};
  filtered.forEach(item => {
    const d = new Date(item[dateField] + 'T00:00:00');
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const v = typeof valueField === 'function' ? valueField(item) : item[valueField];
    if (v != null && !isNaN(v)) {
      if (!map[key] || v > map[key].max) map[key] = { value: v, date: key };
      if (!map[key].min || v < map[key].min) map[key].min = v;
    }
  });

  const points = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (map[key]) {
      points.push(map[key]);
    }
  }
  return points;
}

function drawLineChart(ctx, points, opts) {
  opts = opts || {};
  const width = opts.width || 300;
  const height = opts.height || 150;
  const padding = opts.padding || { top: 16, right: 12, bottom: 24, left: 36 };
  const p = theme.getChartPalette();
  const lineColor = opts.lineColor || p.health;
  const fillColor = opts.fillColor || theme.hexToRgba(p.health, 0.15);
  const textColor = opts.textColor || p.text;
  const gridColor = opts.gridColor || p.grid;
  const maxPoints = opts.maxPoints || 30;

  const usable = points.slice(-maxPoints);
  const count = usable.length;
  if (count < 1) return { ctx, min: null, max: null };

  let min = Infinity, max = -Infinity;
  usable.forEach(p => { min = Math.min(min, p.min != null ? p.min : p.value); max = Math.max(max, p.max != null ? p.max : p.value); });
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.1;
  min -= pad; max += pad;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.fillStyle = textColor;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i;
    const v = max - ((max - min) / 3) * i;
    ctx.fillText(v.toFixed(0), padding.left - 4, y + 3);
  }

  const xOf = i => count === 1 ? padding.left + chartW / 2 : padding.left + (chartW / (count - 1)) * i;
  const yOf = v => padding.top + chartH - ((v - min) / (max - min)) * chartH;

  ctx.beginPath();
  usable.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.min != null ? p.min : p.value);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  const lastX = xOf(count - 1);
  ctx.lineTo(lastX, padding.top + chartH);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  grad.addColorStop(0, fillColor);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  usable.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.value);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  usable.forEach((p, i) => {
    const x = xOf(i);
    const y = yOf(p.value);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
  });

  const step = Math.max(1, Math.floor(count / 4));
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  usable.forEach((p, i) => {
    if (i % step === 0 || i === count - 1) {
      const x = xOf(i);
      const dateStr = (p.date || '').substring(5);
      ctx.fillText(dateStr, x, height - 6);
    }
  });

  return { ctx, min, max, first: usable[0], last: usable[usable.length - 1] };
}

function judgeOxygen(value, pulse) {
  const t = JUDGE_THRESHOLDS.oxygen;
  if (!value) return withJudgeMeta({ label: '数据不足', level: 'none', color: '#999999' }, t.basis);
  if (value < t.critical) return withJudgeMeta({ label: '严重低氧', level: 'critical', color: '#9B59B6' }, t.basis);
  if (value < t.low) return withJudgeMeta({ label: '偏低', level: 'low', color: '#E67E22' }, t.basis);
  if (pulse && pulse > t.pulseHigh) return withJudgeMeta({ label: '偏高(心率快)', level: 'warn', color: '#F39C12' }, t.basis);
  return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
}

// 第二参数可传部位 value（oral/ear/...）或含 value/label 的对象；内部换算为腋温等效后判读。
function judgeTemperature(value, location) {
  const t = JUDGE_THRESHOLDS.temperature;
  if (!value) return withJudgeMeta({ label: '数据不足', level: 'none', color: '#999999' }, t.basis);
  const loc = (location && typeof location === 'object') ? location.value : location;
  const equivalent = toUnderarmEquivalent(value, loc);
  if (equivalent >= t.critical) return withJudgeMeta({ label: '高热', level: 'critical', color: '#9B59B6' }, t.basis);
  if (equivalent >= t.high) return withJudgeMeta({ label: '中高热', level: 'high', color: '#E74C3C' }, t.basis);
  if (equivalent >= t.warn) return withJudgeMeta({ label: '低热', level: 'warn', color: '#F39C12' }, t.basis);
  if (equivalent < t.low) return withJudgeMeta({ label: '偏低', level: 'low', color: '#3498DB' }, t.basis);
  return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
}

function judgeUricAcid(value, gender) {
  const t = JUDGE_THRESHOLDS.uricAcid;
  if (!value) return withJudgeMeta({ label: '数据不足', level: 'none', color: '#999999' }, t.basis);
  const upperLimit = gender === 'female' ? t.femaleUpper : t.maleUpper;
  if (value >= upperLimit) return withJudgeMeta({ label: '偏高', level: 'high', color: '#E74C3C' }, t.basis);
  if (value < t.lower) return withJudgeMeta({ label: '偏低', level: 'low', color: '#3498DB' }, t.basis);
  return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
}

function judgeCholesterol(total, ldl, hdl, tg) {
  const t = JUDGE_THRESHOLDS.cholesterol;
  const parts = [];
  let level = 'normal';
  if (total != null && total >= t.total) { parts.push('总胆偏高'); level = 'high'; }
  if (ldl != null && ldl >= t.ldl) { parts.push('低密度偏高'); level = 'high'; }
  if (hdl != null && hdl < t.hdlLow) { parts.push('高密度偏低'); level = level === 'high' ? 'high' : 'warn'; }
  if (tg != null && tg >= t.tgHigh) { parts.push('甘油三酯偏高'); level = 'high'; }
  else if (tg != null && tg >= t.tgWarn) { parts.push('甘油三酯边缘升高'); if (level !== 'high') level = 'warn'; }
  if (parts.length === 0) parts.push('正常');
  const colorMap = { high: '#E74C3C', warn: '#F39C12', low: '#3498DB', normal: '#27AE60', none: '#999999' };
  return withJudgeMeta({ label: parts.join('，'), level, color: colorMap[level] }, t.basis);
}

function judgePulse(pulse) {
  const t = JUDGE_THRESHOLDS.heartRate;
  if (!pulse) return withJudgeMeta({ label: '', level: 'none', color: '#999999' }, t.basis);
  if (pulse > t.high) return withJudgeMeta({ label: '心动过速', level: 'high', color: '#E74C3C' }, t.basis);
  if (pulse < t.low) return withJudgeMeta({ label: '心动过缓', level: 'low', color: '#3498DB' }, t.basis);
  return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
}

function judgeHeartRate(rate, scene) {
  const t = JUDGE_THRESHOLDS.heartRate;
  if (!rate) return withJudgeMeta({ label: '数据不足', level: 'none', color: '#999999' }, t.basis);
  if (scene === 'exercise' || scene === 'during_exercise') {
    if (rate > t.exerciseHigh) return withJudgeMeta({ label: '运动心率偏高', level: 'high', color: '#E74C3C' }, t.basis);
    if (rate < t.exerciseLow) return withJudgeMeta({ label: '运动心率偏低', level: 'low', color: '#3498DB' }, t.basis);
    return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
  }
  if (rate > t.high) return withJudgeMeta({ label: '心动过速', level: 'high', color: '#E74C3C' }, t.basis);
  if (rate < t.low) return withJudgeMeta({ label: '心动过缓', level: 'low', color: '#3498DB' }, t.basis);
  return withJudgeMeta({ label: '正常', level: 'normal', color: '#27AE60' }, t.basis);
}

function sumByDate(list, dateField, valueField) {
  const map = {};
  (list || []).forEach(item => {
    const d = item[dateField];
    if (!d) return;
    const v = typeof valueField === 'function' ? valueField(item) : item[valueField];
    if (v != null && !isNaN(v)) {
      map[d] = (map[d] || 0) + v;
    }
  });
  return Object.keys(map).sort().map(d => ({ date: d, value: map[d] }));
}

function calcStats(values) {
  if (!values || values.length === 0) return { count: 0 };
  const sorted = values.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: parseFloat((sum / sorted.length).toFixed(1))
  };
}

function calcNormalRate(list, judgeFn) {
  if (!list || list.length === 0) return 0;
  let normal = 0;
  list.forEach(item => {
    const st = judgeFn(item);
    if (st && st.level === 'normal') normal++;
  });
  return Math.round((normal / list.length) * 100);
}

function quickStats(list, valueField, judgeFn) {
  if (!list || list.length === 0) return { count: 0 };
  const values = list.map(item => typeof valueField === 'function' ? valueField(item) : item[valueField]).filter(v => v != null && !isNaN(v));
  const s = calcStats(values);
  s.normalRate = judgeFn ? calcNormalRate(list, judgeFn) : null;
  return s;
}

function buildQuickTip(stats, unit, unitField) {
  if (!stats || stats.count === 0) return '';
  const parts = [];
  if (stats.min != null && stats.max != null) {
    parts.push('最高 ' + stats.max + (unit || ''));
    parts.push('最低 ' + stats.min + (unit || ''));
  }
  if (stats.avg != null) parts.push('平均 ' + stats.avg + (unit || ''));
  return parts.join(' · ');
}

// 运动热量：kcal = MET × 体重(kg) × 时长(小时)。缺体重时用 60kg 作为默认值并标记 isEstimated。
function calcExerciseCalories(met, minutes, weightKg) {
  const m = Number(met) || 0;
  const mins = Number(minutes) || 0;
  if (m <= 0 || mins <= 0) return null;
  const w = Number(weightKg) > 0 ? Number(weightKg) : 60;
  return {
    value: Math.round(m * w * (mins / 60)),
    estimated: !(Number(weightKg) > 0),
    weightUsed: w
  };
}

// 单位换算：血糖 mmol/L <-> mg/dL，体重 kg <-> lbs，身高/体温保持原单位。
function convertUnit(value, from, to) {
  const n = Number(value);
  if (!isFinite(n)) return null;
  if (from === to) return n;
  if (from === 'mmol/L' && to === 'mg/dL') return parseFloat((n * 18.0182).toFixed(1));
  if (from === 'mg/dL' && to === 'mmol/L') return parseFloat((n / 18.0182).toFixed(1));
  if (from === 'kg' && to === 'lbs') return parseFloat((n * 2.20462).toFixed(1));
  if (from === 'lbs' && to === 'kg') return parseFloat((n / 2.20462).toFixed(1));
  if (from === 'cm' && to === 'in') return parseFloat((n / 2.54).toFixed(1));
  if (from === 'in' && to === 'cm') return parseFloat((n * 2.54).toFixed(1));
  return n;
}

// 去重：同一业务日期+时间+来源+关键数值视为同一条，用于手动录入与设备同步双通道合并。
function dedupeRecords(list, keys) {
  const fields = keys || ['date', 'time', 'source', 'value'];
  const seen = {};
  const out = [];
  (list || []).slice().sort((a, b) => {
    const ka = String((a.createdAt || 0));
    const kb = String((b.createdAt || 0));
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  }).forEach(item => {
    const key = fields.map(f => {
      const v = item[f];
      return (v && typeof v === 'object') ? (v.value || '') : (v || '');
    }).join('|');
    if (!seen[key]) { seen[key] = true; out.push(item); }
  });
  return out;
}

// 趋势统计：环比上一周期、极值、达标率。
function trendStats(values, judgeFn) {
  const arr = (values || []).filter(v => v != null && !isNaN(v)).map(Number);
  if (arr.length === 0) return { count: 0 };
  const stats = calcStats(arr);
  const half = Math.max(1, Math.floor(arr.length / 2));
  const prevAvg = arr.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const currAvg = arr.slice(half).reduce((a, b) => a + b, 0) / (arr.length - half);
  stats.change = prevAvg ? parseFloat((((currAvg - prevAvg) / prevAvg) * 100).toFixed(1)) : 0;
  stats.trend = stats.change > 1 ? 'up' : (stats.change < -1 ? 'down' : 'flat');
  if (judgeFn) stats.normalRate = calcNormalRate(arr.map(v => ({ value: v })), item => judgeFn(item.value));
  return stats;
}

module.exports = {
  JUDGE_VERSION,
  MEDICAL_DISCLAIMER,
  JUDGE_THRESHOLDS,
  VITAL_RANGES,
  BP_SOURCE_OPTIONS,
  OXYGEN_SOURCE_OPTIONS,
  BODY_POSITION_OPTIONS,
  ARM_OPTIONS,
  MEAL_TYPE_OPTIONS,
  SPECIMEN_OPTIONS,
  OXYGEN_SCENE_OPTIONS,
  validateNumber,
  validateFields,
  withJudgeMeta,
  normalizeEnum,
  enumLabel,
  toUnderarmEquivalent,
  calcExerciseCalories,
  convertUnit,
  dedupeRecords,
  trendStats,
  GENDER_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  AVATAR_PRESETS,
  HEALTH_TAB_OPTIONS,
  DEFAULT_ENABLED_TABS,
  calcAge,
  calcBMI,
  formatHeight,
  formatWeight,
  groupByDate,
  monthLabel,
  CYCLE_STAGES,
  calcCycleInfo,
  judgeBP,
  GLUCOSE_TYPES,
  HEART_RATE_SCENES,
  DIET_MEAL_TYPES,
  judgeGlucose,
  buildChartPoints,
  drawLineChart,
  judgeOxygen,
  judgeTemperature,
  judgeUricAcid,
  judgeCholesterol,
  judgePulse,
  judgeHeartRate,
  sumByDate,
  calcStats,
  calcNormalRate,
  quickStats,
  buildQuickTip
};