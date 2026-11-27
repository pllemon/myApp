/**
 * m-icon · 统一矢量图标
 * tone=system 系统图标：线性单色，跟随主题深主色 --primary-dark
 * tone=category 分类图标：多彩，按 theme.categoryColors 映射
 * tone=flat 账单类目彩色图标（utils/icons.js FLAT）
 * tone=health 健康彩色图标（utils/health-icons.js HEALTH）
 * tone=module 主题彩色图标（utils/module-icons.js MODULE，随主题切换；支持 muted 灰化用于 tabbar 未选中）
 * 字形来自 utils/icons.js，全主题共用一套，切主题只换颜色。
 */
const glyphs = require('../../utils/icons.js');
const healthGlyphs = require('../../utils/health-icons.js');
const moduleGlyphs = require('../../utils/module-icons.js');
const theme = require('../../utils/theme.js');
const iconMap = require('../../utils/icon-map.js');

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// 纯 JS UTF-8 -> base64，不依赖 wx.arrayBufferToBase64，兼容各版本基础库
function utf8ToBase64(str) {
  let out = '';
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = i < str.length ? str.charCodeAt(i++) : -1;
    const c3 = i < str.length ? str.charCodeAt(i++) : -1;
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >= 0 ? (c2 >> 4) : 0);
    const e3 = c2 < 0 ? 64 : (((c2 & 15) << 2) | (c3 >= 0 ? (c3 >> 6) : 0));
    const e4 = c3 < 0 ? 64 : (c3 & 63);
    out += B64_CHARS[e1] + B64_CHARS[e2] +
      (e3 === 64 ? '=' : B64_CHARS[e3]) + (e4 === 64 ? '=' : B64_CHARS[e4]);
  }
  return out;
}

function svgToDataUri(svg) {
  return 'data:image/svg+xml;base64,' + utf8ToBase64(svg);
}

function buildSvg(path, color, filled) {
  const stroke = filled ? 'none' : color;
  const fill = filled ? color : 'none';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
}

// 彩色扁平图标：64x64 网格、颜色写死在 path 内，不注入主题色、不套描边
function buildFlatSvg(path) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64" width="64" height="64">' + path + '</svg>';
}

// 把彩色 path 里的所有 hex 颜色转成灰阶（tabbar 未选中态用）。
// 保留明暗层次：按亮度加权算灰度，再把饱和度压到接近 0。
function grayFlatPath(path) {
  return path.replace(/#[0-9A-Fa-f]{6}/g, function (hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    // 62% 灰度 + 38% 白，得到偏浅的灰，与预览一致；纯白保持白
    const v = Math.min(255, Math.round(l * 0.62 + 97));
    const h = v.toString(16).padStart(2, '0');
    return '#' + h + h + h;
  });
}

Component({
  properties: {
    name: { type: String, value: '' },
    value: { type: String, value: '' },
    flatKey: { type: String, value: '' },
    healthKey: { type: String, value: '' },
    moduleKey: { type: String, value: '' },
    muted: { type: Boolean, value: false },
    tone: { type: String, value: 'auto' },
    size: { type: Number, value: 40 },
    color: { type: String, value: '' },
    categoryKey: { type: String, value: '' },
    categoryIndex: { type: Number, value: -1 },
    inline: { type: Boolean, value: false },
    chip: { type: Boolean, value: false }
  },

  data: {
    src: '',
    boxSize: 40,
    useChip: false,
    chipBg: '',
    chipSize: 0
  },

  observers: {
    'name, value, flatKey, healthKey, moduleKey, muted, tone, color, categoryKey, categoryIndex, chip, size': function () {
      this.render();
    }
  },

  lifetimes: {
    attached: function () { this.render(); }
  },

  pageLifetimes: {
    show: function () { this.render(); }
  },

  methods: {
    render: function () {
      const p = this.data;
      const active = theme.getActiveTheme();
      const raw = p.value || p.name || '';
      const name = iconMap.iconOf(raw);

      // tone=health：健康模块彩色图标，独立字典，与账单类目 FLAT 物理分离。
      if (p.tone === 'health') {
        const healthName = p.healthKey || raw;
        if (healthName && healthGlyphs.HEALTH[healthName]) {
          this.setData({
            src: svgToDataUri(buildFlatSvg(healthGlyphs.HEALTH[healthName])),
            boxSize: p.size,
            useChip: false,
            chipBg: '',
            chipSize: p.size + 24
          });
          return;
        }
      }

      // tone=module：首页快捷入口主题图标，按当前主题 id 从 MODULE 字典取图。
      // 9 套主题各有专属配色，切主题时 pageLifetimes.show 会重渲染，图标自动跟随。
      if (p.tone === 'module') {
        const themeId = active.id || 'fenbin';
        const moduleName = moduleGlyphs.moduleNameOf(p.moduleKey || raw);
        const set = moduleGlyphs.MODULE[themeId] || moduleGlyphs.MODULE.fenbin;
        if (moduleName && set && set[moduleName]) {
          const glyph = p.muted ? grayFlatPath(set[moduleName]) : set[moduleName];
          this.setData({
            src: svgToDataUri(buildFlatSvg(glyph)),
            boxSize: p.size,
            useChip: false,
            chipBg: '',
            chipSize: p.size + 24
          });
          return;
        }
      }

      // tone=flat：账单分类彩色图标，固定色、不随主题变，走独立 64 网格。
      // 命中彩色字典才上色；命中不到（如 wallet/chart 等系统图标）回退原线性渲染。
      if (p.tone === 'flat') {
        // 用户在图标选择器中选的是 FLAT 字典里的中文名，优先按它取图，改图标才能立即生效。
        // 旧数据存的是 food/transport 等英文名，不会直接命中，仍回退到分类名精确映射，保持原显示。
        const directFlat = glyphs.FLAT[raw] ? raw : '';
        const flatName = directFlat || iconMap.flatNameOf(p.flatKey) || iconMap.flatNameOf(raw) || iconMap.flatNameOf(name);
        if (flatName && glyphs.FLAT[flatName]) {
          this.setData({
            src: svgToDataUri(buildFlatSvg(glyphs.FLAT[flatName])),
            boxSize: p.size,
            useChip: false,
            chipBg: '',
            chipSize: p.size + 24
          });
          return;
        }
      }

      // tone=auto：系统图标线性单色，语义图标多彩
      let tone = p.tone;
      if (tone === 'auto') tone = iconMap.isSystem(name) ? 'system' : 'category';

      const isCat = tone === 'category';
      // 字形双向回退：天气5枚(cloud/cloudy/drizzle/rain/fog)、餐次4枚、smile/neutral 的字形在 SYSTEM，
      // 心情/自然图标在 CATEGORY。强制 tone=category 时也要能取到字形，否则会落 other 圆圈。
      const path = isCat
        ? (glyphs.CATEGORY[name] || glyphs.SYSTEM[name] || glyphs.CATEGORY.other)
        : (glyphs.SYSTEM[name] || glyphs.CATEGORY[name] || glyphs.SYSTEM.info);

      let color = p.color;
      if (!color) {
        if (isCat) {
          const colors = active.categoryColors || [];
          let idx = p.categoryIndex;
          if (idx < 0) {
            const map = {
              // 记账 / 交通 / 购物
              food: 0, transport: 1, travel: 1, shopping: 2, work: 2, card: 2,
              // 娱乐 / 学习 / 目标
              fun: 3, movie: 3, education: 3, book: 3, brain: 3, target: 3, trophy: 3,
              // 健康 / 医疗 / 运动
              health: 4, medicine: 4, sport: 4, heart: 4, temperature: 4, scale: 4,
              stethoscope: 4, droplet: 4, ambulance: 4,
              // 社交 / 情感 / 宠物
              social: 5, gift: 5, love: 5, pets: 5, celebrate: 5,
              // 财务 / 其他（默认）
              salary: 6, chart: 6, bill: 6, other: 6,
              // —— 以下 40 枚补全语义色（此前未配置，全部落默认紫）——
              // 家居 / 办公 / 物品
              coffee: 1, home: 5, diamond: 2, idea: 2, wifi: 5, repair: 1, office: 5,
              bank: 2, globe: 5, folder: 5, pin: 0, clip: 5, package: 1, hospital: 4,
              ruler: 5, test: 4, puzzle: 3, camera: 5, backpack: 1,
              // 警示 / 火 / 光
              warning: 0, ban: 0, flash: 2, fire: 0,
              // 自然 / 天气 / 天体 —— 天气收敛为 5 组：晴黄 / 云雾青灰 / 阴紫 / 雨雪蓝 / 彩虹红
              flower: 0, plant: 3, moon: 6,
              sun: 2,                       // 晴·黄
              cloud: 4, fog: 4,             // 云雾·青灰（缤纷风色板无纯灰，取青色近灰调）
              cloudy: 6,                    // 阴·紫
              drizzle: 5, rain: 5, snow: 5, // 雨雪·蓝
              rainbow: 0,                   // 彩虹·红
              // 心情 / 状态 —— 整组统一分类色，暖色表正向、冷色表负向/中性
              happy: 2, calm: 4, sad: 5, angry: 0, anxious: 1, confused: 6, think: 6,
              tired: 5, sleep: 6, cool: 3,
              // 功能/状态图标（tone=category 意外走到这里时的语义色）
              flag: 0, repeat: 3, sync: 4, feedback: 5, inbox: 6,
              bookmark: 2, playCircle: 3, checkCircle: 3,
              // 餐次 / 心情 —— 与日记同一套语义色，同一值全页面同色
              breakfast: 2, lunch: 1, dinner: 6, snack: 1,
              smile: 1, neutral: 6, bliss: 1,
              // 其他状态
              meditate: 6, ghost: 6
            };
            idx = map[p.categoryKey || name];
            if (idx === undefined) idx = 6;
          }
          color = colors[idx] || active.colors['--primary'];
        } else {
          color = active.colors['--primary-dark'];
        }
      }

      // chip 模式：彩色圆角底 + 白色图标，用于关键入口（首页/健康tab/列表主图标），
      // 让分类色真正有面积。普通场景保持线性描边，避免满屏色块。
      const useChip = !!p.chip;
      let iconColor = color;
      let chipBg = '';
      if (useChip) {
        chipBg = color;
        iconColor = '#FFFFFF';
      }

      // 字形库全部按线性描边设计：纯描边路径一旦 fill 会变成实心块或整条消失。
      // 统一用描边渲染，多彩由 color / chip 底色体现。
      const filled = false;
      this.setData({
        src: svgToDataUri(buildSvg(path, iconColor, filled)),
        boxSize: p.size,
        useChip: useChip,
        chipBg: chipBg,
        chipSize: p.size + 24
      });
    }
  }
});
