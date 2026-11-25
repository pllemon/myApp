const GENDER_OPTIONS = [
  { value: 'male', label: '男', icon: '👨' },
  { value: 'female', label: '女', icon: '👩' }
];

const BLOOD_TYPE_OPTIONS = ['A', 'B', 'AB', 'O', 'RH-A', 'RH-B', 'RH-AB', 'RH-O', '未知'];

const AVATAR_PRESETS = [
  '👤', '👨', '👩', '👴', '👵', '🧑', '👶', '🧒', '👦', '👧', '🦸', '🧙', '🧚', '🐱', '🐶', '🐰'
];

const HEALTH_TAB_OPTIONS = [
  { key: 'height', label: '身高', icon: '📏' },
  { key: 'weight', label: '体重', icon: '⚖️' },
  { key: 'bp', label: '血压', icon: '💓' },
  { key: 'heart_rate', label: '心率', icon: '❤️' },
  { key: 'glucose', label: '血糖', icon: '🩸' },
  { key: 'oxygen', label: '血氧', icon: '🫁' },
  { key: 'temperature', label: '体温', icon: '🌡️' },
  { key: 'water', label: '饮水', icon: '💧' },
  { key: 'sleep', label: '睡眠', icon: '😴' },
  { key: 'exercise', label: '运动', icon: '🏃' },
  { key: 'uric_acid', label: '尿酸', icon: '🧪' },
  { key: 'cholesterol', label: '血脂', icon: '🧫' },
  { key: 'diet', label: '饮食', icon: '🍽️' },
  { key: 'medication', label: '用药', icon: '💊' },
  { key: 'visit', label: '看诊', icon: '🏥' },
  { key: 'period', label: '生理期', icon: '🌸' }
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
  { key: 'period', label: '经期', color: '#E91E63', icon: '🩸' },
  { key: 'ovulation', label: '排卵日', color: '#FF9800', icon: '⭐' },
  { key: 'fertile', label: '易孕期', color: '#4CAF50', icon: '💚' },
  { key: 'safe', label: '安全期', color: '#2196F3', icon: '💙' }
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

function judgeBP(sys, dia) {
  if (!sys || !dia) return { label: '数据不足', level: 'none', color: '#999999' };
  if (sys >= 140 || dia >= 90) return { label: '高血压', level: 'high', color: '#E74C3C' };
  if (sys >= 120 || dia >= 80) return { label: '偏高', level: 'warn', color: '#F39C12' };
  if (sys < 90 || dia < 60) return { label: '低血压', level: 'low', color: '#3498DB' };
  return { label: '正常', level: 'normal', color: '#27AE60' };
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
  { value: 'random', label: '随机' }
];

const DIET_MEAL_TYPES = [
  { value: 'breakfast', label: '早餐', icon: '🌅' },
  { value: 'lunch', label: '午餐', icon: '☀️' },
  { value: 'dinner', label: '晚餐', icon: '🌙' },
  { value: 'snack', label: '加餐', icon: '🍎' }
];

function judgeGlucose(value, type) {
  if (!value) return { label: '数据不足', level: 'none', color: '#999999' };
  let level = 'normal';
  let label = '正常';
  if (type === 'fasting') {
    if (value >= 7.0) { level = 'high'; label = '偏高(糖友)'; }
    else if (value >= 6.1) { level = 'warn'; label = '空腹偏高'; }
    else if (value < 3.9) { level = 'low'; label = '偏低'; }
  } else if (type === 'postprandial') {
    if (value >= 11.1) { level = 'high'; label = '餐后偏高'; }
    else if (value >= 7.8) { level = 'warn'; label = '餐后偏高'; }
    else if (value < 3.9) { level = 'low'; label = '偏低'; }
  } else {
    if (value >= 11.1) { level = 'high'; label = '偏高'; }
    else if (value >= 7.0) { level = 'warn'; label = '偏高'; }
    else if (value < 3.9) { level = 'low'; label = '偏低'; }
  }
  const colorMap = { high: '#E74C3C', warn: '#F39C12', low: '#3498DB', normal: '#27AE60', none: '#999999' };
  return { label, level, color: colorMap[level] };
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
  const lineColor = opts.lineColor || '#E91E63';
  const fillColor = opts.fillColor || 'rgba(233, 30, 99, 0.15)';
  const textColor = opts.textColor || '#999999';
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
  ctx.strokeStyle = '#F0F0F0';
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
  if (!value) return { label: '数据不足', level: 'none', color: '#999999' };
  if (value < 90) return { label: '严重低氧', level: 'critical', color: '#9B59B6' };
  if (value < 95) return { label: '偏低', level: 'low', color: '#E67E22' };
  if (pulse && pulse > 100) return { label: '偏高(心率快)', level: 'warn', color: '#F39C12' };
  return { label: '正常', level: 'normal', color: '#27AE60' };
}

function judgeTemperature(value) {
  if (!value) return { label: '数据不足', level: 'none', color: '#999999' };
  if (value >= 39) return { label: '高热', level: 'critical', color: '#9B59B6' };
  if (value >= 38.5) return { label: '中高热', level: 'high', color: '#E74C3C' };
  if (value >= 37.3) return { label: '低热', level: 'warn', color: '#F39C12' };
  if (value < 36) return { label: '偏低', level: 'low', color: '#3498DB' };
  return { label: '正常', level: 'normal', color: '#27AE60' };
}

function judgeUricAcid(value, gender) {
  if (!value) return { label: '数据不足', level: 'none', color: '#999999' };
  const upperLimit = gender === 'female' ? 360 : 420;
  const lowerLimit = 180;
  if (value >= upperLimit) return { label: '偏高', level: 'high', color: '#E74C3C' };
  if (value < lowerLimit) return { label: '偏低', level: 'low', color: '#3498DB' };
  return { label: '正常', level: 'normal', color: '#27AE60' };
}

function judgeCholesterol(total, ldl, hdl, tg) {
  const parts = [];
  let level = 'normal';
  if (total != null && total >= 5.2) { parts.push('总胆偏高'); level = 'high'; }
  if (ldl != null && ldl >= 3.4) { parts.push('低密度偏高'); level = 'high'; }
  if (hdl != null && hdl < 1.0) { parts.push('高密度偏低'); level = level === 'high' ? 'high' : 'warn'; }
  if (tg != null && tg >= 2.3) { parts.push('甘油三酯偏高'); level = 'high'; }
  else if (tg != null && tg >= 1.7) { parts.push('甘油三酯边缘升高'); if (level !== 'high') level = 'warn'; }
  if (parts.length === 0) parts.push('正常');
  const colorMap = { high: '#E74C3C', warn: '#F39C12', low: '#3498DB', normal: '#27AE60', none: '#999999' };
  return { label: parts.join('，'), level, color: colorMap[level] };
}

function judgePulse(pulse) {
  if (!pulse) return { label: '', level: 'none', color: '#999999' };
  if (pulse > 100) return { label: '心动过速', level: 'high', color: '#E74C3C' };
  if (pulse < 60) return { label: '心动过缓', level: 'low', color: '#3498DB' };
  return { label: '正常', level: 'normal', color: '#27AE60' };
}

function judgeHeartRate(rate, scene) {
  if (!rate) return { label: '数据不足', level: 'none', color: '#999999' };
  if (scene === 'exercise') {
    if (rate > 160) return { label: '运动心率偏高', level: 'high', color: '#E74C3C' };
    if (rate < 90) return { label: '运动心率偏低', level: 'low', color: '#3498DB' };
    return { label: '正常', level: 'normal', color: '#27AE60' };
  }
  if (rate > 100) return { label: '心动过速', level: 'high', color: '#E74C3C' };
  if (rate < 60) return { label: '心动过缓', level: 'low', color: '#3498DB' };
  return { label: '正常', level: 'normal', color: '#27AE60' };
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

module.exports = {
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