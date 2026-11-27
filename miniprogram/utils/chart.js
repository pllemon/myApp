/**
 * Canvas 图表工具 · 主题感知版
 * canvas 不支持 CSS var，所有颜色在绘制时从当前主题 token 取实际色值。
 * 切主题后页面 onShow 重绘即可换色。
 */
const theme = require('./theme.js');

function palette() {
  return theme.getChartPalette();
}

// 分类色：语义稳定（同一分类始终是色板同一位），切主题只换色不换含义
function getCategoryIndex(key) {
  const n = palette().series.length;
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return sum % n;
}

function getCategoryColor(key) {
  const p = palette();
  return p.series[getCategoryIndex(key)];
}

function drawPie(ctx, data, opts) {
  const { cx, cy, radius, donutWidth = 50 } = opts;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;
  const p = palette();

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color || p.series[i % p.series.length];
    ctx.fill();
    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, radius - donutWidth, 0, Math.PI * 2);
  ctx.fillStyle = p.surface;
  ctx.fill();

  ctx.fillStyle = p.text;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¥' + total.toFixed(0), cx, cy - 8);
  ctx.font = '12px sans-serif';
  ctx.fillText('总支出', cx, cy + 14);
}

function drawBar(ctx, data, opts) {
  const { x, y, width, height } = opts;
  if (!data.length) return;
  const p = palette();
  const padding = 8;
  const barWidth = (width - padding * (data.length - 1)) / data.length;
  const max = Math.max(...data.map(d => Math.max(d.value1 || 0, d.value2 || 0)));
  if (max === 0) return;

  data.forEach((d, i) => {
    const bx = x + i * (barWidth + padding);
    if (d.value1 != null) {
      const h1 = (d.value1 / max) * height;
      ctx.fillStyle = d.color1 || p.danger;
      ctx.fillRect(bx, y + height - h1, barWidth, h1);
    }
    if (d.value2 != null) {
      const h2 = (d.value2 / max) * height;
      ctx.fillStyle = d.color2 || p.success;
      ctx.fillRect(bx + barWidth / 2, y + height - h2, barWidth / 2, h2);
    }
    if (d.label) {
      ctx.fillStyle = p.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(d.label, bx + barWidth / 2, y + height + 6);
    }
  });
}

function drawTrend(ctx, data, opts) {
  const { x, y, width, height, baseline = 0 } = opts;
  if (!data.length) return;
  const p = palette();
  const padding = 4;
  const barWidth = (width - padding * (data.length - 1)) / data.length;
  const values = data.map(d => d.value || 0);
  const max = Math.max(...values, baseline);
  const min = Math.min(...values, baseline);
  const range = max - min || 1;

  data.forEach((d, i) => {
    const bx = x + i * (barWidth + padding);
    const val = d.value || 0;
    const barH = ((val - min) / range) * (height - 10);
    const by = y + height - barH;
    const color = d.color || p.primary;

    const gradient = ctx.createLinearGradient(0, by, 0, y + height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, theme.hexToRgba(color, 0.19));
    ctx.fillStyle = gradient;
    ctx.fillRect(bx, by, barWidth, barH);

    if (d.label) {
      ctx.fillStyle = p.text;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(d.label, bx + barWidth / 2, y + height + 6);
    }
  });
}

function clearAll(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
}

module.exports = {
  getCategoryColor,
  getCategoryIndex,
  palette,
  drawPie,
  drawBar,
  drawTrend,
  clearAll
};
