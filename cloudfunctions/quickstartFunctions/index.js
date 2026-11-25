const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const getOpenId = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
  };
};

const createRecord = async (event) => {
  const { collection, data } = event;
  if (!collection || !data) {
    return { success: false, errMsg: "collection and data required" };
  }
  try {
    const result = await db.collection(collection).add({
      data: {
        ...data,
        createdAt: db.serverDate(),
      },
    });
    return { success: true, _id: result._id };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
};

const queryRecords = async (event) => {
  const { collection, where = {}, orderBy = { field: "createdAt", direction: "desc" }, limit = 100, skip = 0 } = event;
  if (!collection) {
    return { success: false, errMsg: "collection required" };
  }
  try {
    const result = await db
      .collection(collection)
      .where(where)
      .orderBy(orderBy.field, orderBy.direction)
      .skip(skip)
      .limit(limit)
      .get();
    return { success: true, data: result.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
};

const updateRecord = async (event) => {
  const { collection, _id, data } = event;
  if (!collection || !_id || !data) {
    return { success: false, errMsg: "collection, _id and data required" };
  }
  try {
    await db.collection(collection).doc(_id).update({ data });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
};

const deleteRecord = async (event) => {
  const { collection, _id } = event;
  if (!collection || !_id) {
    return { success: false, errMsg: "collection and _id required" };
  }
  try {
    await db.collection(collection).doc(_id).remove();
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
};

const aggregateStats = async (event) => {
  const { collection, pipeline = [] } = event;
  if (!collection) {
    return { success: false, errMsg: "collection required" };
  }
  try {
    const result = await db.collection(collection).aggregate(pipeline).end();
    return { success: true, data: result.list };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
};

exports.main = async (event, context) => {
  const { action } = event;
  switch (action) {
    case "getOpenId": return await getOpenId();
    case "create": return await createRecord(event);
    case "query": return await queryRecords(event);
    case "update": return await updateRecord(event);
    case "delete": return await deleteRecord(event);
    case "stats": return await aggregateStats(event);
    default: return { success: false, errMsg: `unknown action: ${action}` };
  }
};