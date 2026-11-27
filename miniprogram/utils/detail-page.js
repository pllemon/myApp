/**
 * 内容型详情页统一工厂
 * 依据《交互规范与重构基线 v1.0》3.1：内容型条目点击进详情页，详情页提供编辑入口。
 *
 * 统一封装：
 * - onLoad 取 id 并加载；onShow 静默刷新（编辑页保存返回后数据不过期）
 * - 统一加载态、不存在处理、导航栏标题
 * - 统一图片预览、编辑跳转、删除确认与清理
 *
 * 各页面只通过 config 声明差异，不再重复写生命周期与删除逻辑。
 */
const db = require('./db.js');
const ui = require('./interaction.js');
const dateUtil = require('./date.js');
const imageUtil = require('./image.js');

/**
 * @param {Object} config
 * @param {string} config.collection 集合名（db.COLLECTIONS.XXX）
 * @param {string} config.editPath 编辑页绝对路径，如 /pages/movie/edit/index
 * @param {string} [config.titleKey] 用作导航栏标题的字段名
 * @param {string} [config.defaultTitle] 无标题字段时的导航栏标题
 * @param {string} [config.emptyTip] 记录不存在时的提示
 * @param {Function} [config.decorate] 条目装饰器，与列表页保持同一套展示字段
 * @param {Function} [config.onLoaded] 加载完成后的页面内派生数据钩子（this 指向页面实例）
 * @param {Object} [config.extraMethods] 页面特有方法（如快捷切换状态）
 * @returns {Object} Page 配置对象
 */
function createDetailPage(config) {
  const cfg = config || {};

  const page = {
    data: {
      id: '',
      item: null,
      createdAtLabel: '',
      updatedAtLabel: ''
    },

    onLoad(options) {
      const id = (options && options.id) || '';
      this.setData({ id });
      if (!id) {
        ui.toast(cfg.emptyTip || '内容不存在', 'none');
        setTimeout(() => wx.navigateBack(), 1000);
        return;
      }
      this.loadDetail(true);
    },

    onShow() {
      // 从编辑页返回时静默刷新，避免详情页停留在旧数据
      if (this.data.id && this._loaded) this.loadDetail(false);
    },

    async loadDetail(showLoading) {
      const withLoading = showLoading !== false;
      if (withLoading) wx.showLoading({ title: '加载中', mask: true });
      try {
        const raw = await db.getById(cfg.collection, this.data.id);
        if (!raw) {
          ui.toast(cfg.emptyTip || '内容不存在', 'none');
          setTimeout(() => wx.navigateBack(), 1000);
          return;
        }
        const item = cfg.decorate ? cfg.decorate(raw) : raw;
        const title = (cfg.titleKey && item[cfg.titleKey]) || cfg.defaultTitle || '详情';
        wx.setNavigationBarTitle({ title: String(title).slice(0, 16) });
        this._loaded = true;
        this.setData({
          item,
          createdAtLabel: raw.createdAt ? dateUtil.friendlyTime(raw.createdAt) : '',
          updatedAtLabel: raw.updatedAt ? dateUtil.friendlyTime(raw.updatedAt) : ''
        });
        if (typeof cfg.onLoaded === 'function') cfg.onLoaded.call(this, item);
      } catch (err) {
        console.error('detail loadDetail error:', err);
        ui.toast('加载失败', 'none');
      } finally {
        if (withLoading) wx.hideLoading();
      }
    },

    goEdit() {
      if (!this.data.id) return;
      wx.navigateTo({ url: cfg.editPath + '?id=' + this.data.id });
    },

    previewImage(e) {
      const index = Number((e.currentTarget.dataset && e.currentTarget.dataset.index) || 0);
      const images = (this.data.item && this.data.item.images) || [];
      if (!images.length) return;
      imageUtil.preview(index, images);
    },

    async deleteItem() {
      const ok = await ui.confirmDelete();
      if (!ok) return;
      try {
        const old = await db.getById(cfg.collection, this.data.id);
        if (old) imageUtil.cleanAllImages(old.images);
        await db.remove(cfg.collection, this.data.id);
        ui.toast('已删除');
        setTimeout(() => wx.navigateBack(), 500);
      } catch (err) {
        console.error('detail deleteItem error:', err);
        ui.toast('删除失败', 'none');
      }
    }
  };

  if (cfg.extraMethods) Object.assign(page, cfg.extraMethods);
  return page;
}

module.exports = { createDetailPage };
