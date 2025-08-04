import type { NextFunction, Request, Response } from "express";
import { cookieOptions } from "../../../config/cookie.config";
import { createGuestAccount, signup } from "../../../controllers/user.controller";
import { respObj } from "../../../helpers/responsePattern.helper";
import * as userService from "../../../service/user.service";

jest.mock("../../../service/user.service");
jest.mock("../../../helpers/responsePattern.helper");
jest.mock("../../../config/cookie.config", () => ({
  cookieOptions: { httpOnly: true, secure: true },
}));

describe("User Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUserService = userService as jest.Mocked<typeof userService>;
  const mockRespObj = respObj as jest.MockedFunction<typeof respObj>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
    mockRespObj.mockReturnValue({ success: true, data: {}, message: "" });
  });

  describe("signup", () => {
    it("deve criar usuário com sucesso", async () => {
      const userData = { name: "TESTE123", password: "teste123" };
      const expectedData = { name: "teste123", password: "teste123" };
      const mockServiceResponse = { message: "Usuário criado com sucesso" };
      mockRequest.body = userData;
      mockUserService.signup.mockResolvedValue(mockServiceResponse);

      await signup(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockUserService.signup).toHaveBeenCalledWith(expectedData);
      expect(mockRespObj).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve transformar nome para lowercase", async () => {
      const userData = { name: "USUARIO123", password: "senha123" };
      const expectedData = { name: "usuario123", password: "senha123" };
      mockRequest.body = userData;
      mockUserService.signup.mockResolvedValue({ message: "Sucesso" });

      await signup(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockUserService.signup).toHaveBeenCalledWith(expectedData);
    });

    it("deve preservar outros campos do body", async () => {
      const userData = {
        name: "TESTE123",
        password: "teste123",
        email: "teste@email.com",
        extraField: "valor",
      };
      const expectedData = {
        name: "teste123",
        password: "teste123",
        email: "teste@email.com",
        extraField: "valor",
      };
      mockRequest.body = userData;
      mockUserService.signup.mockResolvedValue({ message: "Sucesso" });

      await signup(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockUserService.signup).toHaveBeenCalledWith(expectedData);
    });

    it("deve chamar next() quando service lança erro", async () => {
      const userData = { name: "teste", password: "senha" };
      const error = new Error("Usuário já existe");
      mockRequest.body = userData;
      mockUserService.signup.mockRejectedValue(error);

      await signup(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("deve tratar erro de validação", async () => {
      const userData = { name: "aa", password: "bb" };
      const error = new Error("Dados inválidos");
      mockRequest.body = userData;
      mockUserService.signup.mockRejectedValue(error);

      await signup(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockUserService.signup).toHaveBeenCalledWith({
        name: "aa",
        password: "bb",
      });
    });
  });

  describe("createGuestAccount", () => {
    it("deve criar conta de visitante com sucesso", async () => {
      const mockTokens = {
        accessToken: "guest-access-token",
        refreshToken: "guest-refresh-token",
      };
      mockUserService.createGuestAccount.mockResolvedValue(mockTokens);

      await createGuestAccount(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockUserService.createGuestAccount).toHaveBeenCalledWith();
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", mockTokens.refreshToken, cookieOptions);
      expect(mockRespObj).toHaveBeenCalledWith({
        data: { accessToken: mockTokens.accessToken },
        message: "Conta de visitante criada com sucesso",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando service lança erro", async () => {
      const error = new Error("Erro ao criar conta de visitante");
      mockUserService.createGuestAccount.mockRejectedValue(error);

      await createGuestAccount(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("deve configurar cookie com opções corretas", async () => {
      const mockTokens = {
        accessToken: "test-access",
        refreshToken: "test-refresh",
      };
      mockUserService.createGuestAccount.mockResolvedValue(mockTokens);

      await createGuestAccount(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.cookie).toHaveBeenCalledWith("refreshToken", "test-refresh", cookieOptions);
    });

    it("deve retornar resposta no formato correto", async () => {
      const mockTokens = {
        accessToken: "formatted-access-token",
        refreshToken: "formatted-refresh-token",
      };
      mockUserService.createGuestAccount.mockResolvedValue(mockTokens);

      await createGuestAccount(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockRespObj).toHaveBeenCalledWith({
        data: { accessToken: "formatted-access-token" },
        message: "Conta de visitante criada com sucesso",
      });
    });

    it("não deve depender de parâmetros de request", async () => {
      const mockTokens = {
        accessToken: "independent-token",
        refreshToken: "independent-refresh",
      };
      mockRequest = {};
      mockUserService.createGuestAccount.mockResolvedValue(mockTokens);

      await createGuestAccount(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockUserService.createGuestAccount).toHaveBeenCalledWith();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });
});
