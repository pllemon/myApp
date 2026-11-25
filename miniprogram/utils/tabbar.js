function getTabBar() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (!currentPage || !currentPage.selectComponent) return null;
  return currentPage.selectComponent('#tabbar');
}

function showBadge(pagePath, count) {
  const tabBar = getTabBar();
  if (tabBar && tabBar.showBadge) tabBar.showBadge(pagePath, count);
}

function showDot(pagePath) {
  const tabBar = getTabBar();
  if (tabBar && tabBar.showDot) tabBar.showDot(pagePath);
}

function hideBadge(pagePath) {
  const tabBar = getTabBar();
  if (tabBar && tabBar.hideBadge) tabBar.hideBadge(pagePath);
}

module.exports = {
  showBadge,
  showDot,
  hideBadge
};