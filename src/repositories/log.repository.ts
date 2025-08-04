import { Log } from "../models/log.model";

export const getTotalLogs = async (since: Date) => {
  return await Log.countDocuments({ timestamp: { $gte: since } });
};

export const getError500Count = async (since: Date) => {
  return await Log.countDocuments({
    timestamp: { $gte: since },
    statusCode: { $gte: 500 },
  });
};

export const getHeatMapData = async (since: Date) => {
  return await Log.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: "$feature",
        requests: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userID" },
      },
    },
    {
      $project: {
        feature: "$_id",
        requests: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
        _id: 0,
      },
    },
  ]);
};

export const getSlowestRoutesData = async (since: Date) => {
  return await Log.aggregate([
    { $match: { timestamp: { $gte: since }, statusCode: { $lt: 500 } } },
    {
      $group: {
        _id: { method: "$method", route: "$route" },
        avgTime: { $avg: "$responseTime" },
        requests: { $sum: 1 },
      },
    },
    { $sort: { avgTime: -1 } },
    { $limit: 5 },
    {
      $project: {
        endpoint: { $concat: ["$_id.method", " ", "$_id.route"] },
        avgTime: { $round: ["$avgTime", 0] },
        requests: 1,
        _id: 0,
      },
    },
  ]);
};
