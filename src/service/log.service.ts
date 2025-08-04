import * as repository from "../repositories/log.repository";

export const getError500Rate = async () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const total = await repository.getTotalLogs(last24h);
  const errors500 = await repository.getError500Count(last24h);

  return {
    total,
    errors500,
    rate: total > 0 ? ((errors500 / total) * 100).toFixed(2) : "0.00",
  };
};

export const getHeatMap = async () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return await repository.getHeatMapData(last24h);
};

export const getSlowestRoutes = async () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return await repository.getSlowestRoutesData(last24h);
};

export const getSummary = async () => {
  const [error500Rate, heatMap, slowestRoutes] = await Promise.all([getError500Rate(), getHeatMap(), getSlowestRoutes()]);

  return {
    error500Rate,
    heatMap,
    slowestRoutes,
    timestamp: new Date().toISOString(),
  };
};
