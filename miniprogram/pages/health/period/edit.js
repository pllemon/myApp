const db = require('../../../utils/db.js');
const diaryUtil = require('../../../utils/diary.js');

const FLOW_OPTIONS = ['少量', '正常', '较多', '大量'];
const SYMPTOM_OPTIONS = ['腹痛', '腰酸', '头痛', '乏力', '乳房胀痛', '情绪波动', '失眠', '食欲不振'];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    startDate: '',
    endDate: '',
    flow: '',
    flowOptions: FLOW_OPTIONS,
    symptoms: [],
    symptomOptions: SYMPTOM_OPTIONS,
    mood: 'calm',
    moodLabel: diaryUtil.MOOD_LABELS.calm,
    moodOptions: diaryUtil.MOOD_OPTIONS,
    painLevel: 0,
    painText: '没什么感觉',
    notes: ''
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      startDate: this.formatToday()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑生理期' });
      this.loadPeriod(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增生理期' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async loadPeriod(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const p = await db.getById(db.COLLECTIONS.HEALTH_PERIOD, id);
      if (p) {
        this.setData({
          startDate: p.startDate || this.formatToday(),
          endDate: p.endDate || '',
          flow: p.flow || '',
          symptoms: p.symptoms || [],
          mood: p.mood || '',
          moodLabel: diaryUtil.MOOD_LABELS[p.mood] || '',
          painLevel: p.painLevel || 0,
          painText: this.calcPainText(p.painLevel || 0),
          notes: p.notes || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onStartChange(e) { this.setData({ startDate: e.detail.value }); },
  onEndChange(e) { this.setData({ endDate: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onFlowChange(e) { this.setData({ flow: e.detail.value }); },

  onSymptomsChange(e) { this.setData({ symptoms: e.detail.values }); },
  onMoodChange(e) {
    const mood = e.detail.value;
    this.setData({ mood, moodLabel: diaryUtil.MOOD_LABELS[mood] || '' });
  },

  calcPainText(level) {
    if (level === 0) return '没什么感觉';
    if (level <= 2) return '轻微不适';
    if (level <= 3) return '有点痛';
    return '很痛，影响正常生活';
  },

  onPainChange(e) { 
    const level = parseInt(e.detail.value);
    this.setData({ painLevel: level, painText: this.calcPainText(level) }); 
  },

  async save() {
    const { startDate, endDate, flow, symptoms, mood, painLevel, notes, profileId, id, isEdit } = this.data;

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        startDate,
        endDate,
        flow,
        symptoms,
        mood,
        painLevel,
        notes: notes.trim()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_PERIOD, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_PERIOD, record);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});