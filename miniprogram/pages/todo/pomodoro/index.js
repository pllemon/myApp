const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');

const countKey = () => '__pomodoro_count_' + dateUtil.today();

const MODES = [
  { key: 'work', label: '专注', seconds: 25 * 60, color: '#FF6B6B' },
  { key: 'shortBreak', label: '短休', seconds: 5 * 60, color: '#52C41A' },
  { key: 'longBreak', label: '长休', seconds: 15 * 60, color: '#4A90D9' }
];

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatTime(s) { s = Math.max(0, Math.floor(s)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }

Page({
  data: {
    modes: MODES,
    mode: 'work',
    display: '25:00',
    progress: 0,
    status: 'idle',
    ringColor: '#FF6B6B',
    todoId: '',
    todoTitle: '',
    hasTodo: false,
    completedCount: 0
  },

  _timer: null,
  _startTs: 0,
  _baseRemaining: 0,

  onLoad(options) {
    const mode = this.getMode();
    this._baseRemaining = mode.seconds;
    let completedCount = 0;
    try { completedCount = wx.getStorageSync(countKey()) || 0; } catch (e) {}
    this.setData({
      ringColor: mode.color,
      totalSeconds: mode.seconds,
      display: formatTime(mode.seconds),
      completedCount
    });
    if (options && options.id) {
      this.loadTodo(options.id);
    }
  },

  getMode() {
    return MODES.find(m => m.key === this.data.mode) || MODES[0];
  },

  async loadTodo(id) {
    try {
      const todo = await db.getById(db.COLLECTIONS.TODO, id);
      if (todo) {
        this.setData({ todoId: id, todoTitle: todo.title, hasTodo: true });
      }
    } catch (e) {
      console.error('loadTodo pomodoro error:', e);
    }
  },

  selectMode(e) {
    if (this.data.status === 'running') return;
    const { key } = e.currentTarget.dataset;
    if (key === this.data.mode) return;
    const mode = MODES.find(m => m.key === key);
    this.setData({ mode: key, ringColor: mode.color, totalSeconds: mode.seconds });
    this.reset();
  },

  start() {
    if (this.data.status === 'running') return;
    this._startTs = Date.now();
    if (this.data.status !== 'paused') {
      this._baseRemaining = this.data.totalSeconds;
    }
    this.setData({ status: 'running' });
    this._timer = setInterval(() => this.tick(), 1000);
    this.tick();
  },

  tick() {
    const elapsed = Math.floor((Date.now() - this._startTs) / 1000);
    const rem = this._baseRemaining - elapsed;
    if (rem <= 0) {
      this.setData({ display: '00:00', progress: 1 });
      this.finish();
      return;
    }
    const progress = (this.data.totalSeconds - rem) / this.data.totalSeconds;
    this.setData({ display: formatTime(rem), progress });
  },

  pause() {
    if (this.data.status !== 'running') return;
    clearInterval(this._timer);
    this._timer = null;
    const elapsed = Math.floor((Date.now() - this._startTs) / 1000);
    this._baseRemaining = Math.max(0, this._baseRemaining - elapsed);
    this.setData({ status: 'paused', display: formatTime(this._baseRemaining) });
  },

  reset() {
    clearInterval(this._timer);
    this._timer = null;
    const mode = this.getMode();
    this._baseRemaining = mode.seconds;
    this.setData({
      status: 'idle',
      display: formatTime(mode.seconds),
      progress: 0
    });
  },

  finish() {
    clearInterval(this._timer);
    this._timer = null;
    const count = this.data.completedCount + 1;
    try { wx.setStorageSync(countKey(), count); } catch (e) {}
    this.setData({ status: 'finished', completedCount: count });
    try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}
    if (this.data.hasTodo && this.data.mode === 'work') {
      wx.showModal({
        title: '番茄完成',
        content: '是否将该待办标记为已完成？',
        confirmText: '标记完成',
        cancelText: '继续',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await db.update(db.COLLECTIONS.TODO, this.data.todoId, { completed: true, completedAt: Date.now() });
            wx.showToast({ title: '已完成', icon: 'success' });
          } catch (e) {
            console.error('complete todo error:', e);
          }
        }
      });
    } else {
      wx.showToast({ title: '完成一个番茄', icon: 'none' });
    }
  },

  onUnload() {
    clearInterval(this._timer);
    this._timer = null;
  },

  onHide() {
    if (this.data.status === 'running') {
      clearInterval(this._timer);
      this._timer = null;
      const elapsed = Math.floor((Date.now() - this._startTs) / 1000);
      this._baseRemaining = Math.max(0, this._baseRemaining - elapsed);
      this.setData({ status: 'paused', display: formatTime(this._baseRemaining) });
    }
  }
});