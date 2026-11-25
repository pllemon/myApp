const PAGE_SIZE = 100;

async function fetchAll(queryFn) {
  let all = [];
  let skip = 0;
  while (true) {
    const res = await queryFn(skip, PAGE_SIZE);
    const batch = res.data || [];
    all = all.concat(batch);
    if (batch.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  return all;
}

function add(key, record) {
  const db = wx.cloud.database();
  return db.collection(key).add({ data: record }).then(res => ({ ...record, _id: res._id }));
}

function list(key, sortBy) {
  const db = wx.cloud.database();
  return fetchAll((skip, limit) => {
    let q = db.collection(key);
    if (sortBy) q = q.orderBy(sortBy.key, sortBy.order || 'asc');
    return q.skip(skip).limit(limit).get();
  });
}

function query(key, filter, sortBy) {
  const db = wx.cloud.database();
  return fetchAll((skip, limit) => {
    let q = db.collection(key).where(filter || {});
    if (sortBy) q = q.orderBy(sortBy.key, sortBy.order || 'asc');
    return q.skip(skip).limit(limit).get();
  });
}

function getById(key, id) {
  const db = wx.cloud.database();
  return db.collection(key).doc(id).get().then(res => res.data);
}

function update(key, id, patch) {
  const db = wx.cloud.database();
  return db.collection(key).doc(id).update({ data: patch }).then(() => ({ ...patch, _id: id }));
}

function remove(key, id) {
  const db = wx.cloud.database();
  return db.collection(key).doc(id).remove().then(res => res.stats.removed > 0);
}

function count(key, filter) {
  const db = wx.cloud.database();
  return db.collection(key).where(filter || {}).count().then(res => res.total);
}

async function page(key, opts = {}) {
  const { filter, sortBy, page = 1, pageSize = 50 } = opts;
  const db = wx.cloud.database();
  let q = db.collection(key).where(filter || {});
  if (sortBy) q = q.orderBy(sortBy.key, sortBy.order || 'asc');
  const totalRes = await db.collection(key).where(filter || {}).count();
  const data = await q.skip((page - 1) * pageSize).limit(pageSize).get();
  const total = totalRes.total;
  return {
    list: data.data || [],
    total,
    hasMore: page * pageSize < total
  };
}

module.exports = {
  add,
  list,
  query,
  getById,
  update,
  remove,
  count,
  page
};