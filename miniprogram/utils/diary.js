const db = require('./db.js');

// 枚举统一结构：{ value: 图标名（存值）, label: 中文, color: 分类色索引 }
// 兼容字段 emoji/icon 保留为 value 别名，页面旧写法 wx:key="emoji" / item.icon 仍能取到。
// 着色统一走 tone=category，跟随主题分类色板，同一值在所有页面同色。
const MOOD_OPTIONS = [
  { value: 'happy', emoji: 'happy', label: '开心', color: 2 },
  { value: 'smile', emoji: 'smile', label: '愉快', color: 1 },
  { value: 'calm', emoji: 'calm', label: '平静', color: 4 },
  { value: 'neutral', emoji: 'neutral', label: '一般', color: 6 },
  { value: 'sad', emoji: 'sad', label: '低落', color: 5 },
  { value: 'angry', emoji: 'angry', label: '烦躁', color: 0 },
  { value: 'sleep', emoji: 'sleep', label: '疲惫', color: 6 },
  { value: 'bliss', emoji: 'bliss', label: '幸福', color: 1 },  // 眯眼笑脸，与其余9项同家族
  { value: 'think', emoji: 'think', label: '思考', color: 6 },
  { value: 'cool', emoji: 'cool', label: '自信', color: 3 }
];

// 天气 8 项收敛为 5 组色：晴黄 / 云雾青灰 / 阴紫 / 雨雪蓝 / 彩虹红
const WEATHER_OPTIONS = [
  { value: 'sun', icon: 'sun', label: '晴', color: 2 },
  { value: 'cloud', icon: 'cloud', label: '多云', color: 4 },
  { value: 'cloudy', icon: 'cloudy', label: '阴', color: 6 },
  { value: 'drizzle', icon: 'drizzle', label: '小雨', color: 5 },
  { value: 'rain', icon: 'rain', label: '大雨', color: 5 },
  { value: 'snow', icon: 'snow', label: '雪', color: 5 },
  { value: 'fog', icon: 'fog', label: '雾', color: 4 },
  { value: 'rainbow', icon: 'rainbow', label: '彩虹', color: 0 }
];

// 图标名 -> 中文 label，用于列表/详情/年鉴的统一回显
const MOOD_LABELS = {};
MOOD_OPTIONS.forEach(o => { MOOD_LABELS[o.value] = o.label; });
const WEATHER_LABELS = {};
WEATHER_OPTIONS.forEach(o => { WEATHER_LABELS[o.value] = o.label; });

// 中文 label -> 图标名（兼容历史数据；开发阶段数据会清，此处仅兜底显示）
const MOOD_VALUE_OF = {};
MOOD_OPTIONS.forEach(o => { MOOD_VALUE_OF[o.label] = o.value; });
const WEATHER_VALUE_OF = {};
WEATHER_OPTIONS.forEach(o => { WEATHER_VALUE_OF[o.label] = o.value; });

const DEFAULT_TAGS = ['工作', '学习', '生活', '运动', '旅行', '美食', '阅读', '观影', '音乐', '社交', '家庭', '梦想'];

function extractTagsFromContent(content) {
  if (!content) return [];
  const tagRegex = /#([^#\s]+)/g;
  const tags = [];
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  return tags;
}

function getSummary(content, maxLen) {
  maxLen = maxLen || 60;
  if (!content) return '';
  const text = content.replace(/[\r\n]+/g, ' ').replace(/#[^#\s]+/g, '').trim();
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function groupByDate(list) {
  const groups = {};
  list.forEach(item => {
    const date = item.date || '';
    if (!groups[date]) {
      groups[date] = { date, items: [] };
    }
    groups[date].items.push(item);
  });
  return Object.values(groups).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  
  const yesterday = new Date(now.getTime() - 86400000);
  const yStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
  
  if (dateStr === today) return '今天';
  if (dateStr === yStr) return '昨天';
  
  const d = new Date(dateStr);
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  const thisYear = now.getFullYear();
  
  if (d.getFullYear() === thisYear) {
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekday}`;
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

module.exports = {
  MOOD_OPTIONS,
  WEATHER_OPTIONS,
  MOOD_LABELS,
  WEATHER_LABELS,
  MOOD_VALUE_OF,
  WEATHER_VALUE_OF,
  DEFAULT_TAGS,
  extractTagsFromContent,
  getSummary,
  groupByDate,
  formatDateLabel
};