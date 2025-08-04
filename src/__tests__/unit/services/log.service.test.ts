import * as repository from "../../../repositories/log.repository";
import * as service from "../../../service/log.service";

jest.mock("../../../repositories/log.repository", () => ({
  getTotalLogs: jest.fn(),
  getError500Count: jest.fn(),
  getHeatMapData: jest.fn(),
  getSlowestRoutesData: jest.fn(),
}));

const mockRepository = repository as jest.Mocked<typeof repository>;

describe("Log Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(new Date("2024-01-02T00:00:00Z").getTime());
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getError500Rate", () => {
    it("deve calcular taxa de erro 500 corretamente quando há logs", async () => {
      const totalLogs = 100;
      const error500Logs = 5;
      mockRepository.getTotalLogs.mockResolvedValue(totalLogs);
      mockRepository.getError500Count.mockResolvedValue(error500Logs);

      const res = await service.getError500Rate();
      const expectedDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(mockRepository.getTotalLogs).toHaveBeenCalledWith(expectedDate);
      expect(mockRepository.getError500Count).toHaveBeenCalledWith(expectedDate);
      expect(res).toEqual({
        total: totalLogs,
        errors500: error500Logs,
        rate: "5.00",
      });
    });

    it("deve retornar taxa 0.00 quando não há logs", async () => {
      mockRepository.getTotalLogs.mockResolvedValue(0);
      mockRepository.getError500Count.mockResolvedValue(0);

      const res = await service.getError500Rate();
      expect(res).toEqual({
        total: 0,
        errors500: 0,
        rate: "0.00",
      });
    });

    it("deve retornar taxa 0.00 quando há logs mas nenhum erro 500", async () => {
      mockRepository.getTotalLogs.mockResolvedValue(100);
      mockRepository.getError500Count.mockResolvedValue(0);

      const res = await service.getError500Rate();
      expect(res).toEqual({
        total: 100,
        errors500: 0,
        rate: "0.00",
      });
    });

    it("deve propagar erro do repository", async () => {
      const mockError = new Error("Repository error");
      mockRepository.getTotalLogs.mockRejectedValue(mockError);
      await expect(service.getError500Rate()).rejects.toThrow("Repository error");
    });
  });

  describe("getHeatMap", () => {
    it("deve retornar dados de heat map do repository", async () => {
      const mockHeatMapData = [
        { feature: "books", requests: 50, uniqueUsers: 10 },
        { feature: "auth", requests: 30, uniqueUsers: 8 },
      ];
      mockRepository.getHeatMapData.mockResolvedValue(mockHeatMapData);

      const res = await service.getHeatMap();
      const expectedDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(mockRepository.getHeatMapData).toHaveBeenCalledWith(expectedDate);
      expect(res).toEqual(mockHeatMapData);
    });

    it("deve propagar erro do repository", async () => {
      const mockError = new Error("Repository error");
      mockRepository.getHeatMapData.mockRejectedValue(mockError);
      await expect(service.getHeatMap()).rejects.toThrow("Repository error");
    });
  });

  describe("getSlowestRoutes", () => {
    it("deve retornar dados das rotas mais lentas do repository", async () => {
      const mockSlowestRoutes = [
        { endpoint: "GET /books", avgTime: 1200, requests: 15 },
        { endpoint: "POST /auth/login", avgTime: 800, requests: 25 },
      ];
      mockRepository.getSlowestRoutesData.mockResolvedValue(mockSlowestRoutes);

      const res = await service.getSlowestRoutes();
      const expectedDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(mockRepository.getSlowestRoutesData).toHaveBeenCalledWith(expectedDate);
      expect(res).toEqual(mockSlowestRoutes);
    });

    it("deve propagar erro do repository", async () => {
      const mockError = new Error("Repository error");
      mockRepository.getSlowestRoutesData.mockRejectedValue(mockError);

      await expect(service.getSlowestRoutes()).rejects.toThrow("Repository error");
    });
  });

  describe("getSummary", () => {
    it("deve retornar resumo completo com todas as métricas", async () => {
      const mockError500Rate = { total: 100, errors500: 5, rate: "5.00" };
      const mockHeatMap = [{ feature: "books", requests: 50, uniqueUsers: 10 }];
      const mockSlowestRoutes = [{ endpoint: "GET /books", avgTime: 1200, requests: 15 }];

      jest.spyOn(service, "getError500Rate").mockResolvedValue(mockError500Rate);
      jest.spyOn(service, "getHeatMap").mockResolvedValue(mockHeatMap);
      jest.spyOn(service, "getSlowestRoutes").mockResolvedValue(mockSlowestRoutes);

      const res = await service.getSummary();
      expect(service.getError500Rate).toHaveBeenCalled();
      expect(service.getHeatMap).toHaveBeenCalled();
      expect(service.getSlowestRoutes).toHaveBeenCalled();
      expect(res.error500Rate).toEqual(mockError500Rate);
      expect(res.heatMap).toEqual(mockHeatMap);
      expect(res.slowestRoutes).toEqual(mockSlowestRoutes);
      expect(res.timestamp).toBeDefined();
      expect(typeof res.timestamp).toBe("string");
      expect(new Date(res.timestamp)).toBeInstanceOf(Date);
    });

    it("deve executar todas as operações em paralelo", async () => {
      const mockError500Rate = { total: 0, errors500: 0, rate: "0.00" };
      const mockHeatMap: any[] = [];
      const mockSlowestRoutes: any[] = [];

      jest.spyOn(service, "getError500Rate").mockResolvedValue(mockError500Rate);
      jest.spyOn(service, "getHeatMap").mockResolvedValue(mockHeatMap);
      jest.spyOn(service, "getSlowestRoutes").mockResolvedValue(mockSlowestRoutes);

      const startTime = Date.now();
      await service.getSummary();
      const endTime = Date.now();
      expect(service.getError500Rate).toHaveBeenCalledTimes(1);
      expect(service.getHeatMap).toHaveBeenCalledTimes(1);
      expect(service.getSlowestRoutes).toHaveBeenCalledTimes(1);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("deve propagar erro se qualquer operação falhar", async () => {
      const mockError = new Error("Service error");
      jest.spyOn(service, "getError500Rate").mockRejectedValue(mockError);
      jest.spyOn(service, "getHeatMap").mockResolvedValue([]);
      jest.spyOn(service, "getSlowestRoutes").mockResolvedValue([]);

      await expect(service.getSummary()).rejects.toThrow("Service error");
    });
  });
});
