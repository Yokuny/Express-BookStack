import { Log } from "../../../models/log.model";
import * as repository from "../../../repositories/log.repository";

jest.mock("../../../models/log.model", () => ({
  Log: {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

const mockLog = Log as jest.Mocked<typeof Log>;

describe("Log Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTotalLogs", () => {
    it("deve retornar contagem total de logs desde uma data", async () => {
      const since = new Date("2024-01-01");
      const expectedCount = 100;

      mockLog.countDocuments.mockResolvedValue(expectedCount);

      const res = await repository.getTotalLogs(since);

      expect(mockLog.countDocuments).toHaveBeenCalledWith({ timestamp: { $gte: since } });
      expect(res).toBe(expectedCount);
    });

    it("deve propagar erro ao falhar na contagem", async () => {
      const since = new Date("2024-01-01");
      const mockError = new Error("Database error");

      mockLog.countDocuments.mockRejectedValue(mockError);

      await expect(repository.getTotalLogs(since)).rejects.toThrow("Database error");
      expect(mockLog.countDocuments).toHaveBeenCalledWith({ timestamp: { $gte: since } });
    });
  });

  describe("getError500Count", () => {
    it("deve retornar contagem de erros 500 desde uma data", async () => {
      const since = new Date("2024-01-01");
      const expectedCount = 5;
      mockLog.countDocuments.mockResolvedValue(expectedCount);

      const res = await repository.getError500Count(since);

      expect(mockLog.countDocuments).toHaveBeenCalledWith({
        timestamp: { $gte: since },
        statusCode: { $gte: 500 },
      });
      expect(res).toBe(expectedCount);
    });

    it("deve propagar erro ao falhar na contagem", async () => {
      const since = new Date("2024-01-01");
      const mockError = new Error("Database error");

      mockLog.countDocuments.mockRejectedValue(mockError);
      await expect(repository.getError500Count(since)).rejects.toThrow("Database error");
      expect(mockLog.countDocuments).toHaveBeenCalledWith({
        timestamp: { $gte: since },
        statusCode: { $gte: 500 },
      });
    });
  });

  describe("getHeatMapData", () => {
    it("deve retornar dados de heat map agregados", async () => {
      const since = new Date("2024-01-01");
      const mockHeatMapData = [
        { feature: "books", requests: 50, uniqueUsers: 10 },
        { feature: "auth", requests: 30, uniqueUsers: 8 },
        { feature: "users", requests: 20, uniqueUsers: 5 },
      ];
      mockLog.aggregate.mockResolvedValue(mockHeatMapData);

      const res = await repository.getHeatMapData(since);
      expect(mockLog.aggregate).toHaveBeenCalledWith([
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
      expect(res).toEqual(mockHeatMapData);
    });

    it("deve retornar array vazio quando não há dados", async () => {
      const since = new Date("2024-01-01");
      mockLog.aggregate.mockResolvedValue([]);

      const res = await repository.getHeatMapData(since);
      expect(res).toEqual([]);
    });

    it("deve propagar erro ao falhar na agregação", async () => {
      const since = new Date("2024-01-01");
      const mockError = new Error("Aggregation error");
      mockLog.aggregate.mockRejectedValue(mockError);

      await expect(repository.getHeatMapData(since)).rejects.toThrow("Aggregation error");
    });
  });

  describe("getSlowestRoutesData", () => {
    it("deve retornar dados das rotas mais lentas", async () => {
      const since = new Date("2024-01-01");
      const mockSlowestRoutes = [
        { endpoint: "GET /books", avgTime: 1200, requests: 15 },
        { endpoint: "POST /auth/login", avgTime: 800, requests: 25 },
        { endpoint: "PUT /books/:id", avgTime: 600, requests: 8 },
      ];
      mockLog.aggregate.mockResolvedValue(mockSlowestRoutes);

      const res = await repository.getSlowestRoutesData(since);
      expect(mockLog.aggregate).toHaveBeenCalledWith([
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
      expect(res).toEqual(mockSlowestRoutes);
    });

    it("deve retornar array vazio quando não há dados", async () => {
      const since = new Date("2024-01-01");
      mockLog.aggregate.mockResolvedValue([]);

      const res = await repository.getSlowestRoutesData(since);
      expect(res).toEqual([]);
    });

    it("deve propagar erro ao falhar na agregação", async () => {
      const since = new Date("2024-01-01");
      const mockError = new Error("Aggregation error");

      mockLog.aggregate.mockRejectedValue(mockError);
      await expect(repository.getSlowestRoutesData(since)).rejects.toThrow("Aggregation error");
    });
  });
});
