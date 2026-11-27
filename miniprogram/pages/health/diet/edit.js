const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    date: '',
    time: '',
    mealType: 'breakfast',
    mealLabel: '早餐',
    mealIcon: 'breakfast',
    mealOptions: healthUtil.DIET_MEAL_TYPES,
    food: '',
    calories: '',
    notes: '',
    disclaimer: healthUtil.MEDICAL_DISCLAIMER
  },

  onLoad(options) {
    this.setData({
      profileId: options.profileId,
      date: this.formatToday(),
      time: this.formatNowTime()
    });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑饮食' });
      this.loadRecord(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增饮食' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  formatNowTime() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  mealOf(type) {
    const found = this.data.mealOptions.find(o => o.value === type);
    return found || this.data.mealOptions[0];
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const r = await db.getById(db.COLLECTIONS.HEALTH_DIET, id);
      if (r) {
        const meal = this.mealOf(r.mealType);
        this.setData({
          date: r.date || this.formatToday(),
          time: r.time || this.formatNowTime(),
          mealType: meal.value,
          mealLabel: meal.label,
          mealIcon: meal.value,
          food: r.food || '',
          calories: r.calories || '',
          notes: r.notes || ''
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onFoodInput(e) { this.setData({ food: e.detail.value }); },
  onCaloriesInput(e) { this.setData({ calories: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onMealChange(e) {
    const { option } = e.detail;
    this.setData({ mealType: option.value, mealLabel: option.label, mealIcon: option.value });
  },

  async save() {
    const { date, time, mealType, food, calories, notes, profileId, id, isEdit } = this.data;

    if (!food.trim()) {
      wx.showToast({ title: '请填写吃了什么', icon: 'none' });
      return;
    }
    const err = healthUtil.validateFields([{ field: 'calories', value: this.data.calories }]);
    if (err) { wx.showToast({ title: err.message, icon: 'none' }); return; }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId,
        date,
        time,
        mealType,
        food: food.trim(),
        calories: calories ? parseFloat(calories) : '',
        notes: notes.trim(),
        updatedAt: Date.now()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_DIET, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_DIET, record);
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