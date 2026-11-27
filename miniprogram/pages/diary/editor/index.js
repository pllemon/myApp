const db = require('../../../utils/db.js');
const dateUtil = require('../../../utils/date.js');
const diaryUtil = require('../../../utils/diary.js');
const imageUtil = require('../../../utils/image.js');

Page({
  data: {
    id: '',
    isEdit: false,
    title: '',
    content: '',
    mood: 'calm',
    moodLabel: diaryUtil.MOOD_LABELS.calm,
    weather: '',
    weatherLabel: '',
    date: '',
    location: '',
    tags: [],
    images: [],
    showMoodPicker: false,
    showWeatherPicker: false,
    showTagManager: false,
    moodOptions: diaryUtil.MOOD_OPTIONS,
    weatherOptions: diaryUtil.WEATHER_OPTIONS,
    presetTags: diaryUtil.DEFAULT_TAGS,
    customTags: [],
    newTag: '',
    contentLen: 0
  },

  onLoad(options) {
    const today = dateUtil.today();
    this.setData({ date: options.date || today });

    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑日记' });
      this.loadDiary(options.id);
    } else {
      this.loadCustomTags();
    }
  },

  loadCustomTags() {
    wx.getStorage({
      key: 'diary_custom_tags',
      success: (res) => {
        if (res.data) this.setData({ customTags: res.data });
      }
    });
  },

  async loadDiary(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const diary = await db.getById(db.COLLECTIONS.DIARY, id);
      if (diary) {
        // 历史数据可能存中文 label，统一转成图标名再回显
        const mood = diaryUtil.MOOD_VALUE_OF[diary.mood] || diary.mood || 'calm';
        const weather = diaryUtil.WEATHER_VALUE_OF[diary.weather] || diary.weather || '';
        this.setData({
          title: diary.title || '',
          content: diary.content || '',
          mood,
          moodLabel: diaryUtil.MOOD_LABELS[mood] || '',
          weather,
          weatherLabel: diaryUtil.WEATHER_LABELS[weather] || '',
          date: diary.date || dateUtil.today(),
          location: diary.location || '',
          tags: diary.tags || [],
          images: diary.images || [],
          contentLen: (diary.content || '').length
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    const val = e.detail.value;
    this.setData({ content: val, contentLen: val.length });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  toggleMoodPicker() {
    this.setData({ showMoodPicker: !this.data.showMoodPicker, showWeatherPicker: false, showTagManager: false });
  },

  toggleWeatherPicker() {
    this.setData({ showWeatherPicker: !this.data.showWeatherPicker, showMoodPicker: false, showTagManager: false });
  },

  toggleTagManager() {
    this.setData({ showTagManager: !this.data.showTagManager, showMoodPicker: false, showWeatherPicker: false });
  },

  selectMood(e) {
    const mood = e.currentTarget.dataset.value;
    this.setData({ mood, moodLabel: diaryUtil.MOOD_LABELS[mood] || '', showMoodPicker: false });
  },

  selectWeather(e) {
    const weather = e.currentTarget.dataset.value;
    this.setData({ weather, weatherLabel: diaryUtil.WEATHER_LABELS[weather] || '', showWeatherPicker: false });
  },

  clearMood() {
    this.setData({ mood: '', moodLabel: '', showMoodPicker: false });
  },

  clearWeather() {
    this.setData({ weather: '', weatherLabel: '', showWeatherPicker: false });
  },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const tags = [...this.data.tags];
    const idx = tags.indexOf(tag);
    if (idx >= 0) {
      tags.splice(idx, 1);
    } else {
      tags.push(tag);
    }
    this.setData({ tags });
  },

  onNewTagInput(e) {
    this.setData({ newTag: e.detail.value });
  },

  addCustomTag() {
    const tag = this.data.newTag.trim();
    if (!tag) return;
    if (this.data.presetTags.includes(tag) || this.data.customTags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    const customTags = [...this.data.customTags, tag];
    this.setData({ customTags, newTag: '' });
    wx.setStorage({ key: 'diary_custom_tags', data: customTags });
  },

  removeCustomTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const customTags = this.data.customTags.filter(t => t !== tag);
    const tags = this.data.tags.filter(t => t !== tag);
    this.setData({ customTags, tags });
    wx.setStorage({ key: 'diary_custom_tags', data: customTags });
  },

  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  async save() {
    const { title, content, mood, weather, date, location, tags, images, id, isEdit } = this.data;

    if (!content.trim()) {
      wx.showToast({ title: '写点什么吧', icon: 'none' });
      return;
    }

    const extractedTags = diaryUtil.extractTagsFromContent(content);
    const finalTags = [...new Set([...tags, ...extractedTags])];

    wx.showLoading({ title: '保存中', mask: true });
    try {
      if (isEdit) {
        const old = await db.getById(db.COLLECTIONS.DIARY, id);
        if (old) imageUtil.cleanOldImages(old.images || [], images);
      }

      const record = {
        title: title.trim(),
        content: content.trim(),
        mood,
        weather,
        date,
        bizDate: date,
        location: location.trim(),
        tags: finalTags,
        images,
        wordCount: content.trim().length
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.DIARY, id, record);
      } else {
        await db.add(db.COLLECTIONS.DIARY, record);
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