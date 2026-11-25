const COLORS = [
  '#4A90D9', '#F5A623', '#7ED321', '#D946EF', '#13C2C2',
  '#FA8C16', '#1890FF', '#EB2F96', '#F04864', '#597EF7',
  '#52C41A', '#FAAD14', '#2F54EB', '#722ED1', '#13C2C2'
];

function getCategoryIndex(key) {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return sum % COLORS.length;
}

function getCategoryColor(key) {
  return COLORS[getCategoryIndex(key)];
}

function drawPie(ctx, data, opts) {
  const { cx, cy, radius, donutWidth = 50 } = opts;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color || COLORS[i % COLORS.length];
    ctx.fill();
    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, radius - donutWidth, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.fillStyle = '#999';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¥' + total.toFixed(0), cx, cy - 8);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#BBB';
  ctx.fillText('总支出', cx, cy + 14);
}

function drawBar(ctx, data, opts) {
  const { x, y, width, height } = opts;
  if (!data.length) return;
  const padding = 8;
  const barWidth = (width - padding * (data.length - 1)) / data.length;
  const max = Math.max(...data.map(d => Math.max(d.value1 || 0, d.value2 || 0)));
  if (max === 0) return;

  data.forEach((d, i) => {
    const bx = x + i * (barWidth + padding);
    if (d.value1 != null) {
      const h1 = (d.value1 / max) * height;
      ctx.fillStyle = d.color1 || '#4A90D9';
      ctx.fillRect(bx, y + height - h1, barWidth, h1);
    }
    if (d.value2 != null) {
      const h2 = (d.value2 / max) * height;
      ctx.fillStyle = d.color2 || '#7ED321';
      ctx.fillRect(bx + barWidth / 2, y + height - h2, barWidth / 2, h2);
    }
    if (d.label) {
      ctx.fillStyle = '#666';
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

    const gradient = ctx.createLinearGradient(0, by, 0, y + height);
    gradient.addColorStop(0, d.color || '#4A90D9');
    gradient.addColorStop(1, (d.color || '#4A90D9') + '30');
    ctx.fillStyle = gradient;
    ctx.fillRect(bx, by, barWidth, barH);

    if (d.label) {
      ctx.fillStyle = '#888';
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
  COLORS,
  getCategoryColor,
  getCategoryIndex,
  drawPie,
  drawBar,
  drawTrend,
  clearAll
};