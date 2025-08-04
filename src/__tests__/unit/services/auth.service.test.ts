import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../../config";
import type { AuthReq, UserAcess } from "../../../models";
import { CustomError } from "../../../models/error.type";
import * as authRepository from "../../../repositories/auth.repository";
import { generateTokensForGuest, logout, signin } from "../../../service/auth.service";
import * as userService from "../../../service/user.service";

jest.mock("../../../repositories/auth.repository");
jest.mock("../../../service/user.service");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth Service", () => {
  const mockAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
  const mockUserService = userService as jest.Mocked<typeof userService>;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signin", () => {
    const userData: UserAcess = {
      name: "usuario123",
      password: "senha123",
    };

    it("deve fazer login com sucesso", async () => {
      const mockUser = {
        _id: "user-id-123",
        name: "usuario123",
        password: "$2b$10$hashedPassword",
      };
      const mockRefreshToken = "mock-refresh-token";
      const mockAccessToken = "mock-access-token";

      mockUserService.getUserByName.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValueOnce(mockRefreshToken as never).mockReturnValueOnce(mockAccessToken as never);
      mockAuthRepository.updateUserRefreshToken.mockResolvedValue({} as any);

      const res = await signin(userData);

      expect(mockUserService.getUserByName).toHaveBeenCalledWith("usuario123");
      expect(mockBcrypt.compare).toHaveBeenCalledWith("senha123", "$2b$10$hashedPassword");
      expect(mockJwt.sign).toHaveBeenCalledWith({ user: "user-id-123" }, env.REFRESH_TOKEN_SECRET, { expiresIn: "3d" });
      expect(mockJwt.sign).toHaveBeenCalledWith({ user: "user-id-123" }, env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      expect(mockAuthRepository.updateUserRefreshToken).toHaveBeenCalledWith("user-id-123", mockRefreshToken);
      expect(res).toEqual({
        refreshToken: mockRefreshToken,
        accessToken: mockAccessToken,
      });
    });

    it("deve lançar erro quando usuário não for encontrado", async () => {
      mockUserService.getUserByName.mockResolvedValue(null);
      await expect(signin(userData)).rejects.toThrow(new CustomError("Usuário ou senha incorretos", 409));
      expect(mockUserService.getUserByName).toHaveBeenCalledWith("usuario123");
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
      expect(mockAuthRepository.updateUserRefreshToken).not.toHaveBeenCalled();
    });

    it("deve lançar erro quando senha incorreta", async () => {
      const mockUser = {
        _id: "user-id-123",
        name: "usuario123",
        password: "$2b$10$hashedPassword",
      };

      mockUserService.getUserByName.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);
      await expect(signin(userData)).rejects.toThrow(new CustomError("Usuário ou senha incorretos", 403));
      expect(mockUserService.getUserByName).toHaveBeenCalledWith("usuario123");
      expect(mockBcrypt.compare).toHaveBeenCalledWith("senha123", "$2b$10$hashedPassword");
      expect(mockJwt.sign).not.toHaveBeenCalled();
      expect(mockAuthRepository.updateUserRefreshToken).not.toHaveBeenCalled();
    });

    it("deve converter ObjectId para string ao atualizar refresh token", async () => {
      const mockUser = {
        _id: { toString: jest.fn().mockReturnValue("object-id-string") },
        password: "hashedPassword",
      };
      const mockRefreshToken = "refresh-token";
      mockUserService.getUserByName.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue(mockRefreshToken as never);
      mockAuthRepository.updateUserRefreshToken.mockResolvedValue({} as any);

      await signin(userData);
      expect(mockUser._id.toString).toHaveBeenCalled();
      expect(mockAuthRepository.updateUserRefreshToken).toHaveBeenCalledWith("object-id-string", mockRefreshToken);
    });

    it("deve gerar tokens com configurações corretas", async () => {
      const mockUser = { _id: "user-123", password: "hash" };
      mockUserService.getUserByName.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue("token" as never);
      mockAuthRepository.updateUserRefreshToken.mockResolvedValue({} as any);

      await signin(userData);
      expect(mockJwt.sign).toHaveBeenNthCalledWith(1, { user: "user-123" }, env.REFRESH_TOKEN_SECRET, {
        expiresIn: "3d",
      });
      expect(mockJwt.sign).toHaveBeenNthCalledWith(2, { user: "user-123" }, env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
    });
  });

  describe("generateTokensForGuest", () => {
    const userID = "guest-user-id-123";

    it("deve gerar tokens para usuário visitante", async () => {
      const mockRefreshToken = "guest-refresh-token";
      const mockAccessToken = "guest-access-token";
      mockJwt.sign.mockReturnValueOnce(mockRefreshToken as never).mockReturnValueOnce(mockAccessToken as never);
      mockAuthRepository.updateUserRefreshToken.mockResolvedValue({} as any);

      const res = await generateTokensForGuest(userID);
      expect(mockJwt.sign).toHaveBeenCalledWith({ user: userID }, env.REFRESH_TOKEN_SECRET, { expiresIn: "3d" });
      expect(mockJwt.sign).toHaveBeenCalledWith({ user: userID }, env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      expect(mockAuthRepository.updateUserRefreshToken).toHaveBeenCalledWith(userID, mockRefreshToken);
      expect(res).toEqual({
        refreshToken: mockRefreshToken,
        accessToken: mockAccessToken,
      });
    });

    it("deve atualizar refresh token no repositório", async () => {
      const mockRefreshToken = "new-refresh-token";
      mockJwt.sign.mockReturnValue("token" as never);
      mockAuthRepository.updateUserRefreshToken.mockResolvedValue({} as any);
      mockJwt.sign.mockReturnValueOnce(mockRefreshToken as never);

      await generateTokensForGuest(userID);
      expect(mockAuthRepository.updateUserRefreshToken).toHaveBeenCalledWith(userID, mockRefreshToken);
    });

    it("deve usar configurações corretas para tokens de visitante", async () => {
      mockJwt.sign.mockReturnValue("token" as never);
      mockAuthRepository.updateUserRefreshToken.mockResolvedValue({} as any);

      await generateTokensForGuest(userID);
      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockJwt.sign).toHaveBeenNthCalledWith(1, { user: userID }, env.REFRESH_TOKEN_SECRET, { expiresIn: "3d" });
      expect(mockJwt.sign).toHaveBeenNthCalledWith(2, { user: userID }, env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    });
  });

  describe("logout", () => {
    it("deve fazer logout com sucesso", async () => {
      const mockRequest: AuthReq = {
        user: "user-id-123",
      } as AuthReq;
      mockAuthRepository.removeRefreshToken.mockResolvedValue({} as any);

      const res = await logout(mockRequest);
      expect(mockAuthRepository.removeRefreshToken).toHaveBeenCalledWith("user-id-123");
      expect(res).toEqual({ message: "Logout realizado com sucesso" });
    });

    it("deve remover refresh token do usuário correto", async () => {
      const userID = "specific-user-id";
      const mockRequest: AuthReq = {
        user: userID,
        headers: {},
        body: {},
      } as AuthReq;

      mockAuthRepository.removeRefreshToken.mockResolvedValue({} as any);

      await logout(mockRequest);
      expect(mockAuthRepository.removeRefreshToken).toHaveBeenCalledWith(userID);
    });

    it("deve retornar mensagem de sucesso", async () => {
      const mockRequest: AuthReq = { user: "user-123" } as AuthReq;
      mockAuthRepository.removeRefreshToken.mockResolvedValue({} as any);
      const res = await logout(mockRequest);
      expect(res).toEqual({ message: "Logout realizado com sucesso" });
    });

    it("deve propagar erro do repositório", async () => {
      const mockRequest: AuthReq = { user: "user-123" } as AuthReq;
      const repositoryError = new Error("Erro no repositório");
      mockAuthRepository.removeRefreshToken.mockRejectedValue(repositoryError);
      await expect(logout(mockRequest)).rejects.toThrow(repositoryError);
      expect(mockAuthRepository.removeRefreshToken).toHaveBeenCalledWith("user-123");
    });
  });
});
