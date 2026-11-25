const db = require('./db.js');

const MOOD_OPTIONS = [
  { emoji: '😄', label: '开心', color: '#FFD700' },
  { emoji: '😊', label: '愉快', color: '#87CEEB' },
  { emoji: '😌', label: '平静', color: '#98FB98' },
  { emoji: '😐', label: '一般', color: '#D3D3D3' },
  { emoji: '😔', label: '低落', color: '#B0C4DE' },
  { emoji: '😤', label: '烦躁', color: '#FFA07A' },
  { emoji: '😴', label: '疲惫', color: '#DDA0DD' },
  { emoji: '🥰', label: '幸福', color: '#FFB6C1' },
  { emoji: '🤔', label: '思考', color: '#E6E6FA' },
  { emoji: '😎', label: '自信', color: '#F0E68C' }
];

const WEATHER_OPTIONS = [
  { icon: '☀️', label: '晴' },
  { icon: '⛅', label: '多云' },
  { icon: '☁️', label: '阴' },
  { icon: '🌧️', label: '小雨' },
  { icon: '⛈️', label: '大雨' },
  { icon: '❄️', label: '雪' },
  { icon: '🌫️', label: '雾' },
  { icon: '🌈', label: '彩虹' }
];

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
  DEFAULT_TAGS,
  extractTagsFromContent,
  getSummary,
  groupByDate,
  formatDateLabel
};