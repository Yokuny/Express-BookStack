import { User } from "../../../database";
import type { UserAcess } from "../../../models";
import * as repository from "../../../repositories/user.repository";

jest.mock("../../../database", () => ({
  User: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

const mockUser = User as jest.Mocked<typeof User>;

describe("User Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    it("deve criar um novo usuário", async () => {
      const userData: UserAcess = {
        name: "testuser",
        password: "hashedpassword123",
      };

      const mockCreatedUser = {
        _id: "user123",
        name: "testuser",
        password: "hashedpassword123",
        createdAt: new Date(),
      };

      mockUser.create.mockResolvedValue(mockCreatedUser as any);

      const result = await repository.signup(userData);

      expect(mockUser.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockCreatedUser);
    });

    it("deve propagar erro ao falhar na criação", async () => {
      const userData: UserAcess = {
        name: "testuser",
        password: "hashedpassword123",
      };

      const mockError = new Error("Database error");
      mockUser.create.mockRejectedValue(mockError);

      await expect(repository.signup(userData)).rejects.toThrow("Database error");
      expect(mockUser.create).toHaveBeenCalledWith(userData);
    });
  });

  describe("getUserById", () => {
    it("deve retornar usuário por ID", async () => {
      const userId = "user123";
      const mockFoundUser = {
        _id: userId,
        name: "testuser",
        password: "hashedpassword123",
      };

      mockUser.findById.mockResolvedValue(mockFoundUser as any);

      const result = await repository.getUserById(userId);

      expect(mockUser.findById).toHaveBeenCalledWith(userId, { __v: 0 });
      expect(result).toEqual(mockFoundUser);
    });

    it("deve retornar null quando usuário não existe", async () => {
      const userId = "nonexistent";

      mockUser.findById.mockResolvedValue(null);

      const result = await repository.getUserById(userId);

      expect(mockUser.findById).toHaveBeenCalledWith(userId, { __v: 0 });
      expect(result).toBeNull();
    });

    it("deve propagar erro ao falhar na busca", async () => {
      const userId = "user123";
      const mockError = new Error("Database error");

      mockUser.findById.mockRejectedValue(mockError);

      await expect(repository.getUserById(userId)).rejects.toThrow("Database error");
      expect(mockUser.findById).toHaveBeenCalledWith(userId, { __v: 0 });
    });
  });

  describe("getUserByName", () => {
    it("deve retornar usuário por nome", async () => {
      const userName = "testuser";
      const mockFoundUser = {
        _id: "user123",
        name: userName,
        password: "hashedpassword123",
      };

      mockUser.findOne.mockResolvedValue(mockFoundUser as any);

      const result = await repository.getUserByName(userName);

      expect(mockUser.findOne).toHaveBeenCalledWith({ name: userName }, { __v: 0 });
      expect(result).toEqual(mockFoundUser);
    });

    it("deve retornar null quando usuário não existe", async () => {
      const userName = "nonexistent";

      mockUser.findOne.mockResolvedValue(null);

      const result = await repository.getUserByName(userName);

      expect(mockUser.findOne).toHaveBeenCalledWith({ name: userName }, { __v: 0 });
      expect(result).toBeNull();
    });

    it("deve propagar erro ao falhar na busca", async () => {
      const userName = "testuser";
      const mockError = new Error("Database error");

      mockUser.findOne.mockRejectedValue(mockError);

      await expect(repository.getUserByName(userName)).rejects.toThrow("Database error");
      expect(mockUser.findOne).toHaveBeenCalledWith({ name: userName }, { __v: 0 });
    });
  });
});
