const db = require('../../../utils/db.js');
const imageUtil = require('../../../utils/image.js');
const ui = require('../../../utils/interaction.js');

const VISIT_TYPES = ['门诊', '住院', '急诊', '体检', '复查', '疫苗', '其他'];

Page({
  data: {
    profileId: '',
    id: '',
    isEdit: false,
    title: '',
    visitType: '门诊',
    visitTypes: VISIT_TYPES,
    date: '',
    hospital: '',
    department: '',
    doctor: '',
    diagnosis: '',
    treatment: '',
    cost: '',
    notes: '',
    images: []
  },

  onLoad(options) {
    this.setData({ profileId: options.profileId, date: this.formatToday() });
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑看诊' });
      this.loadVisit(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增看诊' });
    }
  },

  formatToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async loadVisit(id) {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const v = await db.getById(db.COLLECTIONS.HEALTH_VISIT, id);
      if (v) {
        this.setData({
          title: v.title || '',
          visitType: v.visitType || '门诊',
          date: v.date || this.formatToday(),
          hospital: v.hospital || '',
          department: v.department || '',
          doctor: v.doctor || '',
          diagnosis: v.diagnosis || '',
          treatment: v.treatment || '',
          cost: v.cost || '',
          notes: v.notes || '',
          images: v.images || []
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onHospitalInput(e) { this.setData({ hospital: e.detail.value }); },
  onDeptInput(e) { this.setData({ department: e.detail.value }); },
  onDoctorInput(e) { this.setData({ doctor: e.detail.value }); },
  onDiagnosisInput(e) { this.setData({ diagnosis: e.detail.value }); },
  onTreatmentInput(e) { this.setData({ treatment: e.detail.value }); },
  onCostInput(e) { this.setData({ cost: e.detail.value.replace(/[^\d.]/g, '') }); },
  onNotesInput(e) { this.setData({ notes: e.detail.value }); },
  onImagesChange(e) { this.setData({ images: e.detail.images }); },

  onTypeChange(e) { this.setData({ visitType: e.detail.value }); },
  onDateChange(e) { this.setData({ date: e.detail.value }); },

  async save() {
    const d = this.data;
    // 必填：医院或诊断至少一项，否则这条看诊没有可识别信息
    if (!d.hospital.trim() && !d.diagnosis.trim()) {
      wx.showToast({ title: '请填写医院或诊断', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中', mask: true });
    try {
      const record = {
        profileId: d.profileId,
        title: d.title.trim() || d.visitType + '记录',
        visitType: d.visitType,
        date: d.date,
        hospital: d.hospital.trim(),
        department: d.department.trim(),
        doctor: d.doctor.trim(),
        diagnosis: d.diagnosis.trim(),
        treatment: d.treatment.trim(),
        cost: d.cost ? parseFloat(d.cost) : null,
        notes: d.notes.trim(),
        images: d.images,
        updatedAt: Date.now()
      };
      if (d.isEdit) {
        const old = await db.getById(db.COLLECTIONS.HEALTH_VISIT, d.id);
        if (old) imageUtil.cleanOldImages(old.images || [], record.images);
        await db.update(db.COLLECTIONS.HEALTH_VISIT, d.id, record);
      } else {
        await db.add(db.COLLECTIONS.HEALTH_VISIT, record);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async remove() {
    if (!this.data.isEdit) return;
    const res = await ui.confirmDeleteLegacy();
    if (!res.confirm) return;
    try {
      const old = await db.getById(db.COLLECTIONS.HEALTH_VISIT, this.data.id);
      if (old) imageUtil.cleanAllImages(old.images);
      await db.remove(db.COLLECTIONS.HEALTH_VISIT, this.data.id);
      ui.toast('已删除');
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      ui.toast('删除失败', 'none');
    }
  }
});
