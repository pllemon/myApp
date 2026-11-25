const MAX_IMAGES = 9;

async function chooseImages(existingCount, max) {
  const remain = (max || MAX_IMAGES) - existingCount;
  if (remain <= 0) {
    wx.showToast({ title: '最多上传' + (max || MAX_IMAGES) + '张', icon: 'none' });
    return [];
  }
  try {
    const res = await wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed']
    });
    const savedPaths = [];
    for (const item of res.tempFiles) {
      try {
        const saved = await wx.saveFile({ tempFilePath: item.tempFilePath });
        savedPaths.push(saved.savedFilePath);
      } catch (e) {
        savedPaths.push(item.tempFilePath);
      }
    }
    return savedPaths;
  } catch (e) {
    return [];
  }
}

function preview(index, urls) {
  wx.previewImage({
    current: urls[index],
    urls
  });
}

function removeAt(images, index) {
  const next = [...images];
  next.splice(index, 1);
  return next;
}

function cleanOldImages(oldImages, newImages) {
  if (!oldImages || oldImages.length === 0) return;
  const removed = oldImages.filter(p => !newImages.includes(p));
  removed.forEach(p => {
    if (p && p.indexOf && p.indexOf('wxfile://') === 0) {
      wx.removeSavedFile({ filePath: p }).catch(() => {});
    }
  });
}

function cleanAllImages(images) {
  if (!images || images.length === 0) return;
  images.forEach(p => {
    if (p && p.indexOf && p.indexOf('wxfile://') === 0) {
      wx.removeSavedFile({ filePath: p }).catch(() => {});
    }
  });
}

module.exports = {
  MAX_IMAGES,
  chooseImages,
  preview,
  removeAt,
  cleanOldImages,
  cleanAllImages
};