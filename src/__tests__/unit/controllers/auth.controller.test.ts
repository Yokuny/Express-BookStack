import type { NextFunction, Request, Response } from "express";
import { clearCookieOptions, cookieOptions } from "../../../config/cookie.config";
import { logout, refreshToken, signin } from "../../../controllers/auth.controller";
import { respObj } from "../../../helpers/responsePattern.helper";
import type { AuthReq } from "../../../models/interfaces.type";
import * as authService from "../../../service/auth.service";

jest.mock("../../../service/auth.service");
jest.mock("../../../helpers/responsePattern.helper");
jest.mock("../../../config/cookie.config", () => ({
  cookieOptions: { httpOnly: true, secure: true },
  clearCookieOptions: { httpOnly: true, secure: true },
}));

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthReq>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockRespObj = respObj as jest.MockedFunction<typeof respObj>;

  beforeEach(() => {
    mockRequest = {};
    mockAuthRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      locals: {},
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
    mockRespObj.mockReturnValue({ success: true, data: {}, message: "" });
  });

  describe("signin", () => {
    it("deve fazer login com sucesso", async () => {
      const userData = { name: "TESTE123", password: "teste123" };
      const expectedData = { name: "teste123", password: "teste123" };
      const mockTokens = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };
      mockRequest.body = userData;
      mockAuthService.signin.mockResolvedValue(mockTokens);

      await signin(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockAuthService.signin).toHaveBeenCalledWith(expectedData);
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", mockTokens.refreshToken, cookieOptions);
      expect(mockRespObj).toHaveBeenCalledWith({ data: { accessToken: mockTokens.accessToken } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve transformar nome para lowercase", async () => {
      const userData = { name: "TESTE123", password: "teste123" };
      const expectedData = { name: "teste123", password: "teste123" };

      mockRequest.body = userData;
      mockAuthService.signin.mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
      });

      await signin(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockAuthService.signin).toHaveBeenCalledWith(expectedData);
    });

    it("deve chamar next() quando service lança erro", async () => {
      const userData = { name: "teste", password: "senha" };
      const error = new Error("Usuário não encontrado");
      mockRequest.body = userData;
      mockAuthService.signin.mockRejectedValue(error);

      await signin(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    it("deve renovar token com sucesso", async () => {
      const newAccessToken = "new-access-token";
      mockResponse.locals = { newAccessToken };

      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockRespObj).toHaveBeenCalledWith({
        data: {
          accessToken: newAccessToken,
          message: "Token renovado com sucesso",
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando ocorre erro", async () => {
      const error = new Error("Erro interno");
      mockResponse.locals = { newAccessToken: "token" };
      mockResponse.status = jest.fn().mockImplementation(() => {
        throw error;
      });

      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("logout", () => {
    it("deve fazer logout com sucesso", async () => {
      const mockUser = "user-id-123";
      const mockServiceResponse = { message: "Logout realizado com sucesso" };
      mockAuthRequest.user = mockUser;
      mockAuthService.logout.mockResolvedValue(mockServiceResponse);

      await logout(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockAuthRequest);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("refreshToken", clearCookieOptions);
      expect(mockRespObj).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando service lança erro", async () => {
      const error = new Error("Erro no logout");
      mockAuthRequest.user = "user-id";
      mockAuthService.logout.mockRejectedValue(error);

      await logout(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.clearCookie).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("deve passar request completo para o service", async () => {
      const mockAuthReq: Partial<AuthReq> = {
        user: "user-id",
        headers: { authorization: "Bearer token" },
        body: { some: "data" },
      };
      mockAuthService.logout.mockResolvedValue({ message: "Success" });

      await logout(mockAuthReq as AuthReq, mockResponse as Response, mockNext);
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockAuthReq);
    });
  });
});
