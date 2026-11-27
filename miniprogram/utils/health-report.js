const db = require('./db.js');
const healthUtil = require('./health.js');

/**
 * 生成某档案的健康报告（CSV 文本），供医生查阅。
 * 纯前端生成，不上传；用户自行复制或转发。
 */
const REPORT_SECTIONS = [
  { key: 'HEALTH_BP', label: '血压', fields: ['date', 'time', 'systolic', 'diastolic', 'pulse', 'source', 'bodyPosition', 'arm', 'notes'] },
  { key: 'HEALTH_GLUCOSE', label: '血糖', fields: ['date', 'time', 'value', 'type', 'mealType', 'specimenSource', 'notes'] },
  { key: 'HEALTH_HEART_RATE', label: '心率', fields: ['date', 'time', 'rate', 'scene', 'notes'] },
  { key: 'HEALTH_OXYGEN', label: '血氧', fields: ['date', 'time', 'oxygen', 'pulse', 'scene', 'notes'] },
  { key: 'HEALTH_TEMPERATURE', label: '体温', fields: ['date', 'time', 'temperature', 'location', 'notes'] },
  { key: 'HEALTH_WEIGHT', label: '体重', fields: ['date', 'time', 'weight', 'bodyFat', 'bmi', 'notes'] },
  { key: 'HEALTH_HEIGHT', label: '身高', fields: ['date', 'height', 'notes'] },
  { key: 'HEALTH_URIC_ACID', label: '尿酸', fields: ['date', 'uricAcid', 'type', 'notes'] },
  { key: 'HEALTH_CHOLESTEROL', label: '血脂', fields: ['date', 'total', 'ldl', 'hdl', 'tg', 'notes'] },
  { key: 'HEALTH_DIET', label: '饮食', fields: ['date', 'time', 'mealType', 'food', 'calories', 'notes'] },
  { key: 'HEALTH_WATER', label: '饮水', fields: ['date', 'time', 'amount', 'notes'] },
  { key: 'HEALTH_SLEEP', label: '睡眠', fields: ['date', 'sleepTime', 'wakeTime', 'duration', 'quality', 'deepSleep', 'notes'] },
  { key: 'HEALTH_EXERCISE', label: '运动', fields: ['date', 'time', 'type', 'duration', 'distance', 'calories', 'notes'] },
  { key: 'HEALTH_MEDICATION', label: '用药', fields: ['startDate', 'endDate', 'name', 'dosage', 'frequency', 'reminderTimes', 'notes'] },
  { key: 'HEALTH_VISIT', label: '看诊', fields: ['date', 'title', 'visitType', 'hospital', 'department', 'doctor', 'diagnosis', 'treatment', 'cost', 'notes'] },
  { key: 'HEALTH_PERIOD', label: '生理期', fields: ['startDate', 'endDate', 'flow', 'symptoms', 'mood', 'painLevel', 'notes'] }
];

function csvCell(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return '"' + s + '"';
}

async function buildReport(profileId) {
  const profile = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, profileId);
  if (!profile) return null;

  const lines = [];
  lines.push('生活记 · 健康记录报告');
  lines.push('姓名：' + (profile.name || '') + '，性别：' + healthUtil.enumLabel(profile.gender, healthUtil.GENDER_OPTIONS) + '，出生：' + (profile.birthDate || ''));
  lines.push('身高：' + (profile.height || '--') + 'cm，体重：' + (profile.weight || '--') + 'kg');
  if (profile.allergies) lines.push('过敏史：' + profile.allergies);
  if (profile.medicalHistory) lines.push('既往病史：' + profile.medicalHistory);
  lines.push('生成时间：' + new Date().toLocaleString());
  lines.push(healthUtil.MEDICAL_DISCLAIMER);
  lines.push('');

  const summary = [];
  for (const sec of REPORT_SECTIONS) {
    const list = (await db.list(db.COLLECTIONS[sec.key], { key: 'date', order: 'desc' })).filter(r => r.profileId === profileId);
    if (list.length === 0) continue;
    const values = list.map(r => Number(r[sec.fields.find(f => ['systolic', 'value', 'rate', 'oxygen', 'temperature', 'weight', 'height', 'uricAcid', 'total'].indexOf(f) >= 0)])).filter(v => isFinite(v));
    const st = healthUtil.calcStats(values);
    summary.push(sec.label + '：共 ' + list.length + ' 条' + (st.count ? '，平均 ' + st.avg + '，范围 ' + st.min + '–' + st.max : ''));

    lines.push('【' + sec.label + '】');
    lines.push(sec.fields.map(csvCell).join(','));
    list.forEach(r => {
      lines.push(sec.fields.map(f => csvCell(r[f])).join(','));
    });
    lines.push('');
  }

  if (summary.length === 0) summary.push('暂无可导出的健康记录');
  lines.unshift('数据摘要：' + summary.join('；'));
  lines.unshift('');

  return { name: (profile.name || '档案') + '-健康报告.csv', content: lines.join('\n') };
}

module.exports = { buildReport, REPORT_SECTIONS };
