import { User } from "../../../database/user.database";
import type { UserAcess } from "../../../models";
import { getUserById, getUserByName, signup } from "../../../repositories/user.repository";

jest.mock("../../../database/user.database");

describe("User Repository", () => {
  const mockUser = User as jest.Mocked<typeof User>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    it("deve criar um novo usuário no banco", async () => {
      const userData: UserAcess = {
        name: "novoUsuario",
        password: "$2b$10$hashedPassword",
      };
      const createdUser = {
        _id: "user-id-123",
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUser.create.mockResolvedValue(createdUser as any);

      const res = await signup(userData);
      expect(mockUser.create).toHaveBeenCalledWith(userData);
      expect(res).toEqual(createdUser);
    });

    it("deve propagar erro de validação do banco", async () => {
      const invalidUserData = { name: "aa", password: "bb" } as UserAcess;
      const validationError = new Error("Validation failed: name too short");
      mockUser.create.mockRejectedValue(validationError);

      await expect(signup(invalidUserData)).rejects.toThrow(validationError);
      expect(mockUser.create).toHaveBeenCalledWith(invalidUserData);
    });

    it("deve propagar erro de duplicação de usuário", async () => {
      const existingUserData: UserAcess = {
        name: "usuarioExistente",
        password: "hashedPassword",
      };
      const duplicateError = new Error("E11000 duplicate key error");
      mockUser.create.mockRejectedValue(duplicateError);
      await expect(signup(existingUserData)).rejects.toThrow(duplicateError);
    });

    it("deve aceitar dados adicionais no userData", async () => {
      const extendedUserData = {
        name: "usuario",
        password: "hashedPassword",
        email: "test@email.com",
        extraField: "valor",
      } as any;
      mockUser.create.mockResolvedValue({} as any);

      await signup(extendedUserData);
      expect(mockUser.create).toHaveBeenCalledWith(extendedUserData);
    });

    it("deve lidar com senhas já hashadas", async () => {
      const userData: UserAcess = {
        name: "usuario123",
        password: "$2b$10$someHashedPasswordWithCorrectFormat",
      };
      mockUser.create.mockResolvedValue({} as any);
      await signup(userData);
      expect(mockUser.create).toHaveBeenCalledWith(userData);
    });
  });

  describe("getUserById", () => {
    const userID = "user-id-123";
    it("deve buscar usuário por ID", async () => {
      const mockUserData = {
        _id: userID,
        name: "usuario123",
        password: "hashedPassword",
        refreshToken: "refresh-token",
      };
      mockUser.findById.mockResolvedValue(mockUserData as any);

      const res = await getUserById(userID);
      expect(mockUser.findById).toHaveBeenCalledWith(userID, { __v: 0 });
      expect(res).toEqual(mockUserData);
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      mockUser.findById.mockResolvedValue(null);
      const res = await getUserById("invalid-id");
      expect(mockUser.findById).toHaveBeenCalledWith("invalid-id", { __v: 0 });
      expect(res).toBeNull();
    });

    it("deve usar projeção correta excluindo __v", async () => {
      mockUser.findById.mockResolvedValue({} as any);
      await getUserById(userID);
      expect(mockUser.findById).toHaveBeenCalledWith(userID, { __v: 0 });
    });

    it("deve aceitar diferentes formatos de ObjectId", async () => {
      const objectIdString = "507f1f77bcf86cd799439011";
      mockUser.findById.mockResolvedValue({} as any);
      await getUserById(objectIdString);
      expect(mockUser.findById).toHaveBeenCalledWith(objectIdString, { __v: 0 });
    });

    it("deve propagar erro do banco de dados", async () => {
      const dbError = new Error("Database connection error");
      mockUser.findById.mockRejectedValue(dbError);
      await expect(getUserById(userID)).rejects.toThrow(dbError);
    });

    it("deve retornar usuário com todos os campos necessários", async () => {
      const completeUser = {
        _id: userID,
        name: "testUser",
        password: "$2b$10$hashedPassword",
        refreshToken: "valid-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUser.findById.mockResolvedValue(completeUser as any);
      const res = await getUserById(userID);
      expect(res).toEqual(completeUser);
      expect(res).toHaveProperty("_id");
      expect(res).toHaveProperty("name");
      expect(res).toHaveProperty("password");
    });
  });

  describe("getUserByName", () => {
    const userName = "usuario123";

    it("deve buscar usuário por nome", async () => {
      const mockUserData = {
        _id: "user-id-123",
        name: userName,
        password: "hashedPassword",
        refreshToken: "refresh-token",
      };
      mockUser.findOne.mockResolvedValue(mockUserData as any);
      const res = await getUserByName(userName);
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: userName }, { __v: 0 });
      expect(res).toEqual(mockUserData);
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      mockUser.findOne.mockResolvedValue(null);
      const res = await getUserByName("usuarioInexistente");
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: "usuarioInexistente" }, { __v: 0 });
      expect(res).toBeNull();
    });

    it("deve usar projeção correta excluindo __v", async () => {
      mockUser.findOne.mockResolvedValue({} as any);
      await getUserByName(userName);
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: userName }, { __v: 0 });
    });

    it("deve ser case-sensitive na busca por nome", async () => {
      const upperCaseName = "USUARIO123";
      mockUser.findOne.mockResolvedValue(null);
      await getUserByName(upperCaseName);
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: upperCaseName }, { __v: 0 });
    });

    it("deve aceitar nomes com caracteres especiais", async () => {
      const specialName = "user_with.special-chars";
      mockUser.findOne.mockResolvedValue({} as any);
      await getUserByName(specialName);
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: specialName }, { __v: 0 });
    });

    it("deve propagar erro do banco de dados", async () => {
      const dbError = new Error("Database query failed");
      mockUser.findOne.mockRejectedValue(dbError);
      await expect(getUserByName(userName)).rejects.toThrow(dbError);
    });

    it("deve buscar por nomes gerados para contas visitantes", async () => {
      const guestName = "guest_123456789012";
      const guestUser = {
        _id: "guest-id",
        name: guestName,
        password: "randomHashedPassword",
      };
      mockUser.findOne.mockResolvedValue(guestUser as any);
      const res = await getUserByName(guestName);
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: guestName }, { __v: 0 });
      expect(res).toEqual(guestUser);
    });
  });
});
