const db = require('../../../utils/db.js');
const healthUtil = require('../../../utils/health.js');

Page({
  data: {
    id: '',
    isEdit: false,
    avatar: '👤',
    showAvatars: false,
    avatarPresets: healthUtil.AVATAR_PRESETS,
    name: '',
    gender: 'male',
    genders: healthUtil.GENDER_OPTIONS,
    birthDate: '',
    height: '',
    weight: '',
    bloodType: '未知',
    bloodTypes: healthUtil.BLOOD_TYPE_OPTIONS,
    allergies: '',
    medicalHistory: '',
    notes: '',
    _age: '',
    _bmiValue: '',
    _bmiStatus: '',
    showPeriodSection: false,
    lastPeriodStart: '',
    cycleLength: 28,
    tabOptions: healthUtil.HEALTH_TAB_OPTIONS,
    enabledTabs: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑档案' });
      this.loadProfile(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新建档案' });
      this.setData({ enabledTabs: healthUtil.DEFAULT_ENABLED_TABS.slice() });
    }
    this.calcDerived();
  },

  async loadProfile(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const p = await db.getById(db.COLLECTIONS.HEALTH_PROFILE, id);
      if (p) {
        let enabledTabs = p.enabledTabs;
        if (!Array.isArray(enabledTabs) || enabledTabs.length === 0) {
          enabledTabs = healthUtil.HEALTH_TAB_OPTIONS.map(t => t.key);
        }
        this.setData({
          avatar: p.avatar || '👤',
          name: p.name || '',
          gender: p.gender || 'male',
          birthDate: p.birthDate || '',
          height: p.height || '',
          weight: p.weight || '',
          bloodType: p.bloodType || '未知',
          allergies: p.allergies || '',
          medicalHistory: p.medicalHistory || '',
          notes: p.notes || '',
          showPeriodSection: p.gender === 'female',
          lastPeriodStart: p.lastPeriodStart || '',
          cycleLength: p.cycleLength || 28,
          enabledTabs
        });
        this.calcDerived();
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  calcDerived() {
    const age = healthUtil.calcAge(this.data.birthDate);
    const bmi = healthUtil.calcBMI(parseFloat(this.data.height), parseFloat(this.data.weight));
    this.setData({
      _age: age,
      _bmiValue: bmi ? bmi.value : '',
      _bmiStatus: bmi ? bmi.status : ''
    });
  },

  toggleAvatars() {
    this.setData({ showAvatars: !this.data.showAvatars });
  },

  selectAvatar(e) {
    this.setData({ avatar: e.currentTarget.dataset.icon, showAvatars: false });
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onAllergiesInput(e) { this.setData({ allergies: e.detail.value }); },
  onHistoryInput(e) { this.setData({ medicalHistory: e.detail.value }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },

  onGenderChange(e) {
    const { option } = e.detail;
    const g = option.value;
    const patch = { gender: g, showPeriodSection: g === 'female' };
    if (g === 'female') {
      const list = this.data.enabledTabs.slice();
      if (list.indexOf('period') < 0) { list.push('period'); patch.enabledTabs = list; }
    }
    this.setData(patch);
  },

  onBirthDateChange(e) {
    this.setData({ birthDate: e.detail.value });
    this.calcDerived();
  },

  onHeightInput(e) {
    const v = e.detail.value.replace(/[^\d.]/g, '');
    this.setData({ height: v });
    this.calcDerived();
  },

  onWeightInput(e) {
    const v = e.detail.value.replace(/[^\d.]/g, '');
    this.setData({ weight: v });
    this.calcDerived();
  },

  onBloodTypeChange(e) {
    this.setData({ bloodType: e.detail.value });
  },

  onLastPeriodChange(e) {
    this.setData({ lastPeriodStart: e.detail.value });
  },

  onCycleLengthInput(e) {
    const v = parseInt(e.detail.value) || 28;
    this.setData({ cycleLength: Math.max(18, Math.min(60, v)) });
  },

  toggleTab(e) {
    const key = e.currentTarget.dataset.key;
    const list = this.data.enabledTabs.slice();
    const idx = list.indexOf(key);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(key);
    this.setData({ enabledTabs: list });
  },

  async save() {
    const { name, avatar, gender, birthDate, height, weight, bloodType, allergies, medicalHistory, notes, lastPeriodStart, cycleLength, enabledTabs, id, isEdit } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        name: name.trim(),
        avatar,
        gender,
        birthDate,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bloodType,
        allergies: allergies.trim(),
        medicalHistory: medicalHistory.trim(),
        notes: notes.trim(),
        lastPeriodStart: gender === 'female' ? lastPeriodStart : '',
        cycleLength: gender === 'female' ? cycleLength : null,
        enabledTabs: (enabledTabs || []).slice()
      };

      if (isEdit) {
        await db.update(db.COLLECTIONS.HEALTH_PROFILE, id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_PROFILE, record);
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