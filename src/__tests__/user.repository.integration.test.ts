import { User } from "../database";
import * as repository from "../repositories/user.repository";
import type { UserAcess } from "../models";

jest.mock("../database", () => ({
  User: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

const mockUser = User as jest.Mocked<typeof User>;

describe("User Repository Integration Tests", () => {
  let fakeDatabase: any[] = [];
  let nextId = 1;

  beforeEach(() => {
    fakeDatabase = [];
    nextId = 1;
    jest.clearAllMocks();

    mockUser.create.mockImplementation(async (data: any) => {
      const newUser = {
        _id: nextId++,
        ...data,
        createdAt: new Date(),
      };

      const existingUser = fakeDatabase.find((u) => u.name === data.name);
      if (existingUser) {
        throw new Error("E11000 duplicate key error");
      }

      fakeDatabase.push(newUser);
      return newUser;
    });

    mockUser.findById.mockImplementation((async (id: any) => {
      const user = fakeDatabase.find((u) => u._id.toString() === id.toString());
      return user || null;
    }) as any);

    mockUser.findOne.mockImplementation((async (query: any) => {
      const user = fakeDatabase.find((u) => {
        return Object.keys(query).every((key) => u[key] === query[key]);
      });
      return user || null;
    }) as any);

    mockUser.deleteMany.mockImplementation((async () => {
      fakeDatabase = [];
      return { deletedCount: fakeDatabase.length };
    }) as any);
  });

  describe("signup", () => {
    it("deve criar um novo usuário no banco de dados", async () => {
      const userData: UserAcess = {
        name: "testuser",
        password: "hashedpassword123",
      };
      const res = await repository.signup(userData);
      expect(res).toBeDefined();
      expect(res.name).toBe(userData.name);
      expect(res.password).toBe(userData.password);
      expect(res._id).toBeDefined();

      const savedUser = await User.findById(res._id);
      expect(savedUser).toBeDefined();
      expect(savedUser?.name).toBe(userData.name);
    });

    it("deve falhar ao criar usuário com nome duplicado", async () => {
      const userData: UserAcess = {
        name: "duplicateuser",
        password: "hashedpassword123",
      };

      await repository.signup(userData);
      await expect(repository.signup(userData)).rejects.toThrow();
    });
  });

  describe("getUserById", () => {
    it("deve retornar usuário existente por ID", async () => {
      const userData: UserAcess = {
        name: "testuser",
        password: "hashedpassword123",
      };
      const createdUser = await repository.signup(userData);
      const foundUser = await repository.getUserById(createdUser._id.toString());

      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(createdUser._id.toString());
      expect(foundUser?.name).toBe(userData.name);
      expect(foundUser?.password).toBe(userData.password);
      expect(foundUser).not.toHaveProperty("__v");
    });

    it("deve retornar null para ID inexistente", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const res = await repository.getUserById(nonExistentId);
      expect(res).toBeNull();
    });

    it("deve falhar com ID inválido", async () => {
      const invalidId = "invalid-id";
      mockUser.findById.mockImplementation((async () => {
        throw new Error("Cast to ObjectId failed");
      }) as any);

      await expect(repository.getUserById(invalidId)).rejects.toThrow();
    });
  });

  describe("getUserByName", () => {
    it("deve retornar usuário existente por nome", async () => {
      const userData: UserAcess = {
        name: "testuser",
        password: "hashedpassword123",
      };
      const createdUser = await repository.signup(userData);
      const foundUser = await repository.getUserByName(userData.name);

      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(createdUser._id.toString());
      expect(foundUser?.name).toBe(userData.name);
      expect(foundUser?.password).toBe(userData.password);
      expect(foundUser).not.toHaveProperty("__v");
    });

    it("deve retornar null para nome inexistente", async () => {
      const res = await repository.getUserByName("nonexistentuser");
      expect(res).toBeNull();
    });

    it("deve fazer busca case-sensitive", async () => {
      const userData: UserAcess = {
        name: "testuser",
        password: "hashedpassword123",
      };
      await repository.signup(userData);

      const res = await repository.getUserByName("TestUser");
      expect(res).toBeNull();
      const correctRes = await repository.getUserByName("testuser");
      expect(correctRes).toBeDefined();
    });
  });

  describe("Cenários complexos", () => {
    it("deve gerenciar múltiplos usuários corretamente", async () => {
      const users: UserAcess[] = [
        { name: "user1", password: "pass1" },
        { name: "user2", password: "pass2" },
        { name: "user3", password: "pass3" },
      ];

      const createdUsers = await Promise.all(users.map((user) => repository.signup(user)));

      expect(createdUsers).toHaveLength(3);

      for (let i = 0; i < users.length; i++) {
        const foundUser = await repository.getUserByName(users[i].name);
        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe(users[i].name);
        expect(foundUser?._id.toString()).toBe(createdUsers[i]._id.toString());
      }
    });

    it("deve manter integridade dos dados após operações concorrentes", async () => {
      const userData: UserAcess = {
        name: "concurrentuser",
        password: "hashedpassword123",
      };
      const createdUser = await repository.signup(userData);
      const promises = Array(10)
        .fill(null)
        .map(() =>
          Promise.all([repository.getUserById(createdUser._id.toString()), repository.getUserByName(userData.name)])
        );

      const res = await Promise.all(promises);
      res.forEach(([userById, userByName]) => {
        expect(userById).toBeDefined();
        expect(userByName).toBeDefined();
        expect(userById?._id.toString()).toBe(createdUser._id.toString());
        expect(userByName?._id.toString()).toBe(createdUser._id.toString());
      });
    });
  });
});
