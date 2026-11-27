/**
 * emoji -> 矢量图标名 映射
 * 兼容历史数据：老分类/心情/状态里存的是 emoji，展示时统一转成图标名。
 * 新数据直接存图标名。iconOf() 兼容两种输入。
 */

const glyphs = require('./icons.js');

const MAP = {
  // 餐饮
  '🍜': 'food', '🍽': 'food', '🍎': 'food', '🍪': 'food', '🥡': 'food', '🥤': 'food',
  '🍱': 'food', '🍬': 'food', '☕': 'coffee',
  // 交通
  '🚌': 'transport', '🚇': 'transport', '🚕': 'transport', '⛽': 'transport',
  '✈': 'travel', '🚗': 'travel', '🚶': 'transport', '🚴': 'sport', '🚀': 'travel',
  // 购物
  '🛒': 'shopping', '👕': 'shopping', '📱': 'shopping', '🧴': 'shopping', '🛍': 'shopping',
  // 娱乐
  '🎮': 'fun', '🎬': 'movie', '⚽': 'sport', '🏖': 'travel', '🎨': 'fun', '🎵': 'fun',
  '🎸': 'fun', '🎯': 'target', '🏆': 'trophy', '🎈': 'celebrate', '🎉': 'celebrate',
  '🎁': 'gift', '🎂': 'celebrate', '🎓': 'education', '💎': 'diamond',
  // 居家
  '🏠': 'home', '🏡': 'home', '🏘': 'home', '💡': 'idea', '📶': 'wifi', '🔧': 'repair',
  '🏢': 'office', '🏦': 'bank',
  // 医疗健康
  '💊': 'medicine', '🏥': 'hospital', '📋': 'note', '🩸': 'health', '🩺': 'stethoscope',
  '⚕': 'health', '🌡': 'temperature', '❤': 'heart', '💓': 'heart', '💙': 'health',
  '💚': 'health', '🫁': 'health', '🏃': 'sport', '🏊': 'sport', '🏋': 'sport',
  '💃': 'sport', '🥾': 'sport', '🧘': 'meditate', '💪': 'sport', '⚖': 'scale',
  '📏': 'ruler', '🧪': 'test', '🧫': 'test', '🚑': 'ambulance', '🤒': 'health',
  '💧': 'droplet',
  // 学习
  '📚': 'book', '📖': 'book', '✏': 'edit', '✎': 'edit', '✍': 'edit', '🔬': 'test',
  '🧠': 'brain', '🌐': 'globe', '🏛': 'education', '🖼': 'image',
  // 财务
  '💰': 'wallet', '💵': 'wallet', '💸': 'wallet', '💳': 'card', '📈': 'chart',
  '📊': 'chart', '🧧': 'gift',
  // 工作
  '💼': 'work', '💻': 'work', '📁': 'folder', '📌': 'pin', '📎': 'clip', '📄': 'doc',
  '📦': 'package', '📭': 'package', '📒': 'book', '📔': 'book', '📤': 'export', '📥': 'restore',
  // 心情
  '😴': 'sleep', '😌': 'calm', '😊': 'happy', '😄': 'happy', '🥰': 'love', '😔': 'sad',
  '😢': 'sad', '😡': 'angry', '😰': 'anxious', '🤔': 'think', '😤': 'angry',
  '😕': 'confused', '😫': 'tired', '😎': 'cool', '🥱': 'tired', '😣': 'anxious',
  '😖': 'anxious',
  // 自然
  '☀': 'sun', '🌅': 'sun', '🌙': 'moon', '🌸': 'flower', '🌱': 'plant', '🍃': 'plant',
  '🌈': 'rainbow', '☁': 'cloud', '⛅': 'cloud', '🌧': 'cloud', '⛈': 'cloud',
  '❄': 'snow', '🌫': 'cloud', '🌤': 'cloud', '🌍': 'globe', '🌹': 'flower',
  '🍀': 'plant',
  // 人物
  '👨': 'user', '👩': 'user', '👤': 'user', '👦': 'user', '👧': 'user', '👶': 'user',
  '👴': 'user', '👵': 'user', '🧑': 'user', '🧒': 'user', '🦸': 'user', '🧙': 'user',
  '🧚': 'user', '🐰': 'pets', '🐱': 'pets', '🐶': 'pets', '💕': 'love', '💝': 'love',
  '💍': 'celebrate', '♂': 'user',
  // 系统符号
  '✓': 'check', '✅': 'check', '✔': 'check', '✗': 'close', '✕': 'close', '☐': 'check',
  '→': 'chevronRight', '➕': 'add', '⚙': 'settings', '🔍': 'search', '🔎': 'search',
  '⚡': 'flash', '🔥': 'fire', '⚠': 'warning', '🚫': 'ban', '🔁': 'refresh',
  '🔒': 'lock', '💾': 'backup', '🧩': 'puzzle', '★': 'star', '⭐': 'star',
  '🌟': 'star', '✨': 'star', '⭕': 'target', '📍': 'location', '📅': 'calendar',
  '🗑': 'trash', '📝': 'note', '🔀': 'refresh', '💨': 'cloud', '💥': 'flash'
};

const SYSTEM_NAMES = {
  search: 1, back: 1, add: 1, close: 1, edit: 1, trash: 1, more: 1, check: 1,
  chevronRight: 1, chevronDown: 1, calendar: 1, location: 1, settings: 1, info: 1,
  star: 1, share: 1, copy: 1, download: 1, filter: 1, list: 1, home: 1, user: 1,
  chart: 1, clock: 1, tag: 1, image: 1, wallet: 1, note: 1, refresh: 1, eye: 1,
  lock: 1, cloud: 1, phone: 1, storage: 1, backup: 1, restore: 1, export: 1, clear: 1, doc: 1,
  pulse: 1, giftline: 1, bookline: 1, play: 1,
  // 补齐的功能/状态/天气/餐次/心情图标
  palette: 1, feedback: 1, grip: 1, repeat: 1, sync: 1, flag: 1,
  bookmark: 1, playCircle: 1, checkCircle: 1, inbox: 1, link: 1,
  cloudy: 1, drizzle: 1, rain: 1, fog: 1,
  breakfast: 1, lunch: 1, dinner: 1, snack: 1,
  smile: 1, neutral: 1
};

// 历史数据里存在带 emoji 变体符/零宽连接符的图标名（如 food️、meditate‍user️）。
// 先按原值查一次，再归一化后查一次，保证旧 storage 数据和新数据都能命中字形。
function normalizeIconValue(value) {
  return String(value).split('\u200D')[0].replace(/\uFE0F/g, '').trim();
}

// 旧分类名/旧图标名 -> 新彩色图标名（.lang 仅命中明确列出的项，其余沿用原逻辑）
const FLAT_ALIAS = {
  // 大类：旧单色名 -> 新彩色语义图标
  food: '午餐', transport: '公交', shopping: '网购',
  fun: '游戏', movie: '电影', health: '医院', social: '送礼', gift: '送礼',
  salary: '工资', book: '书店', education: '教育',
  medicine: '买药', home: '房租', travel: '旅游', pets: '宠物',
  coffee: '咖啡', sport: '健身', wallet: '银行卡', card: '银行卡',
  hospital: '医院', repair: '装修', office: '房租',
  pin: '景点', wifi: '宽带', work: '工资', chart: '收益',
  // 已移除 4 条语义硬塞：bill→工资(反义)、note→医院、edit→书店、idea→书店。
  // 删除后这些旧名会回退到 CATEGORY 下的同语义线性图标（收据/文档/编辑/灯泡），更准确。
  // 中文别名：历史中文分类名 -> 新图标
  '餐饮': '午餐', '早餐': '午餐', '午餐': '午餐', '堂食': '午餐', '外卖': '外卖',
  '交通': '公交', '购物': '网购', '服饰': '衣服', '衣服': '衣服', '裙子': '连衣裙',
  '娱乐': '游戏', '医疗': '医院', '人情': '送礼', '收入': '工资',
  '理财': '理财', '教育': '教育', '育儿': '育儿', '宠物': '宠物',
  '鲜花': '鲜花', '红包': '红包', '份子钱': '份子钱',
  // 子分类中文名 -> 精确内容图标（flatKey 按内容取图的关键映射）
  '堂食': '午餐', '饮品': '奶茶', '公交地铁': '公交', '火车机票': '高铁',
  '数码': '手机', '日用百货': '日用品', '电影演出': '电影', '运动健身': '健身',
  '旅行': '旅游', '水电燃气': '水电', '网费话费': '宽带', '维修': '装修',
  '药品': '买药', '体检': '医院', '书籍': '书店', '课程': '教育', '学习用品': '书店',
  '基本工资': '工资', '绩效奖金': '奖金', '利息': '收益', '股票基金': '理财',
  '租金': '房租', '线上兼职': '兼职', '线下兼职': '兼职', '红包礼金': '红包', '退款返现': '报销'
};

// 新彩色图标名集合（来自 icons.js 的 FLAT 字典）
const FLAT_NAMES = glyphs.FLAT || {};

// 新彩色图标（tone=flat）：命中则返回规范的新图标名
function flatNameOf(value) {
  if (!value) return '';
  const raw = String(value);
  const v = normalizeIconValue(raw);
  const direct = FLAT_NAMES[raw] ? raw : (FLAT_NAMES[v] ? v : '');
  if (direct) return direct;
  return FLAT_ALIAS[raw] || FLAT_ALIAS[v] || '';
}

// 把任意图标值（emoji 或图标名）归一化为图标名
function iconOf(value) {
  if (!value) return 'other';
  const raw = String(value);
  if (MAP[raw]) return MAP[raw];
  const v = normalizeIconValue(raw);
  if (!v) return 'other';
  if (MAP[v]) return MAP[v];
  if (SYSTEM_NAMES[v]) return v;
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(v)) return v;
  // 中文分类名等无法走英文正则时，兜底匹配新彩色图标别名
  return FLAT_ALIAS[v] || v;
}

// 是否为系统图标（线性单色），否则按分类图标（多彩）处理
function isSystem(name) {
  return !!SYSTEM_NAMES[name];
}

module.exports = {
  MAP: MAP, iconOf: iconOf, isSystem: isSystem,
  flatNameOf: flatNameOf, FLAT_ALIAS: FLAT_ALIAS
};
