import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import type { UserAcess } from "../../../models";
import { CustomError } from "../../../models/error.type";
import * as userRepository from "../../../repositories/user.repository";
import * as authService from "../../../service/auth.service";
import { createGuestAccount, getUserById, getUserByName, signup } from "../../../service/user.service";

jest.mock("../../../repositories/user.repository");
jest.mock("../../../service/auth.service");
jest.mock("bcrypt");
jest.mock("uuid");

describe("User Service", () => {
  const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockUuidv4 = uuidv4 as jest.MockedFunction<() => string>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserByName", () => {
    const userName = "usuario123";

    it("deve retornar usuário quando encontrado", async () => {
      const mockUser = {
        _id: "user-id-123",
        name: "usuario123",
        password: "hashedPassword",
      };
      mockUserRepository.getUserByName.mockResolvedValue(mockUser as any);
      const res = await getUserByName(userName);
      expect(mockUserRepository.getUserByName).toHaveBeenCalledWith(userName);
      expect(res).toEqual(mockUser);
    });

    it("deve lançar erro quando usuário não encontrado e required=true", async () => {
      mockUserRepository.getUserByName.mockResolvedValue(null);
      await expect(getUserByName(userName, true)).rejects.toThrow(new CustomError("Usuário não encontrado", 404));
      expect(mockUserRepository.getUserByName).toHaveBeenCalledWith(userName);
    });

    it("deve retornar null quando usuário não encontrado e required=false", async () => {
      mockUserRepository.getUserByName.mockResolvedValue(null);
      const res = await getUserByName(userName, false);
      expect(res).toBeNull();
      expect(mockUserRepository.getUserByName).toHaveBeenCalledWith(userName);
    });

    it("deve usar required=true por padrão", async () => {
      mockUserRepository.getUserByName.mockResolvedValue(null);
      await expect(getUserByName(userName)).rejects.toThrow(new CustomError("Usuário não encontrado", 404));
    });
  });

  describe("getUserById", () => {
    const userID = "user-id-123";

    it("deve retornar usuário quando encontrado", async () => {
      const mockUser = {
        _id: userID,
        name: "usuario123",
        password: "hashedPassword",
      };
      mockUserRepository.getUserById.mockResolvedValue(mockUser as any);

      const res = await getUserById(userID);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userID);
      expect(res).toEqual(mockUser);
    });

    it("deve lançar erro quando usuário não encontrado", async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);
      await expect(getUserById(userID)).rejects.toThrow(new CustomError("Usuário não encontrado", 404));
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userID);
    });
  });

  describe("signup", () => {
    const userData: UserAcess = {
      name: "novoUsuario",
      password: "senha123",
    };

    it("deve criar usuário com sucesso", async () => {
      const hashedPassword = "$2b$10$hashedPassword";
      const expectedUserData = {
        name: "novoUsuario",
        password: hashedPassword,
      };
      mockUserRepository.getUserByName.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.signup.mockResolvedValue({} as any);

      const res = await signup(userData);
      expect(mockUserRepository.getUserByName).toHaveBeenCalledWith("novoUsuario");
      expect(mockBcrypt.hash).toHaveBeenCalledWith("senha123", 10);
      expect(mockUserRepository.signup).toHaveBeenCalledWith(expectedUserData);
      expect(res).toEqual({ message: "Usuário criado com sucesso" });
    });

    it("deve lançar erro quando usuário já existe", async () => {
      const existingUser = { _id: "existing-id", name: "novoUsuario" };
      mockUserRepository.getUserByName.mockResolvedValue(existingUser as any);

      await expect(signup(userData)).rejects.toThrow(new CustomError("Usuário já existe", 409));
      expect(mockUserRepository.getUserByName).toHaveBeenCalledWith("novoUsuario");
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.signup).not.toHaveBeenCalled();
    });

    it("deve usar getUserByName com required=false", async () => {
      mockUserRepository.getUserByName.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.signup.mockResolvedValue({} as any);

      await signup(userData);
      expect(mockUserRepository.getUserByName).toHaveBeenCalledWith("novoUsuario");
    });

    it("deve fazer hash da senha com salt 10", async () => {
      mockUserRepository.getUserByName.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.signup.mockResolvedValue({} as any);

      await signup(userData);
      expect(mockBcrypt.hash).toHaveBeenCalledWith("senha123", 10);
    });

    it("deve preservar outros campos do userData", async () => {
      const extendedUserData = {
        name: "usuario",
        password: "senha",
        email: "test@email.com",
        extraField: "valor",
      } as any;
      const hashedPassword = "hashedPass";
      mockUserRepository.getUserByName.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.signup.mockResolvedValue({} as any);

      await signup(extendedUserData);
      expect(mockUserRepository.signup).toHaveBeenCalledWith({
        name: "usuario",
        password: hashedPassword,
        email: "test@email.com",
        extraField: "valor",
      });
    });
  });

  describe("createGuestAccount", () => {
    it("deve criar conta de visitante com sucesso", async () => {
      const mockGuestId = "guest1234567";
      const mockPassword = "randompass123456";
      const mockHashedPassword = "$2b$10$hashedGuestPassword";
      const mockCreatedUser = {
        _id: { toString: jest.fn().mockReturnValue("created-user-id") },
        name: `guest_${mockGuestId}`,
        password: mockHashedPassword,
      };
      const mockTokens = {
        accessToken: "guest-access-token",
        refreshToken: "guest-refresh-token",
      };
      mockUuidv4
        .mockReturnValueOnce("guest1234567-890a-bcde-fghi-jklmnopqrstu")
        .mockReturnValueOnce("randompass123-456-789a-bcde-fghijklmnopq");
      mockBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
      mockUserRepository.signup.mockResolvedValue(mockCreatedUser as any);
      mockAuthService.generateTokensForGuest.mockResolvedValue(mockTokens);

      const res = await createGuestAccount();
      expect(mockUuidv4).toHaveBeenCalledTimes(2);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(mockPassword, 10);
      expect(mockUserRepository.signup).toHaveBeenCalledWith({
        name: `guest_${mockGuestId}`,
        password: mockHashedPassword,
      });
      expect(mockCreatedUser._id.toString).toHaveBeenCalled();
      expect(mockAuthService.generateTokensForGuest).toHaveBeenCalledWith("created-user-id");
      expect(res).toEqual(mockTokens);
    });

    it("deve gerar nome de visitante no formato correto", async () => {
      const mockUuid = "12345678-9012-3456-7890-123456789012";
      const expectedGuestName = "guest_123456789012";
      mockUuidv4.mockReturnValue(mockUuid);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.signup.mockResolvedValue({ _id: { toString: () => "id" } } as any);
      mockAuthService.generateTokensForGuest.mockResolvedValue({} as any);

      await createGuestAccount();
      expect(mockUserRepository.signup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expectedGuestName,
        })
      );
    });

    it("deve gerar senha aleatória no formato correto", async () => {
      const mockUuid = "abcdef12-3456-7890-abcd-ef1234567890";
      const expectedPassword = "abcdef1234567890";

      mockUuidv4.mockReturnValue(mockUuid);
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.signup.mockResolvedValue({ _id: { toString: () => "id" } } as any);
      mockAuthService.generateTokensForGuest.mockResolvedValue({} as any);
      await createGuestAccount();
      expect(mockBcrypt.hash).toHaveBeenCalledWith(expectedPassword, 10);
    });

    it("deve retornar tokens gerados pelo authService", async () => {
      const expectedTokens = {
        accessToken: "specific-access-token",
        refreshToken: "specific-refresh-token",
      };

      mockUuidv4.mockReturnValue("mock-uuid");
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.signup.mockResolvedValue({ _id: { toString: () => "user-id" } } as any);
      mockAuthService.generateTokensForGuest.mockResolvedValue(expectedTokens);

      const res = await createGuestAccount();
      expect(res).toEqual(expectedTokens);
    });

    it("deve propagar erro do repositório", async () => {
      const repositoryError = new Error("Erro no banco de dados");
      mockUuidv4.mockReturnValue("mock-uuid");
      mockBcrypt.hash.mockResolvedValue("hashedPassword" as never);
      mockUserRepository.signup.mockRejectedValue(repositoryError);

      await expect(createGuestAccount()).rejects.toThrow(repositoryError);
      expect(mockAuthService.generateTokensForGuest).not.toHaveBeenCalled();
    });
  });
});
