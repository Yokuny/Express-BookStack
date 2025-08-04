import { User } from "../../../database/user.database";
import { getUserByRefreshToken, removeRefreshToken, updateUserRefreshToken } from "../../../repositories/auth.repository";

jest.mock("../../../database/user.database");

describe("Auth Repository", () => {
  const mockUser = User as jest.Mocked<typeof User>;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserByRefreshToken", () => {
    const refreshToken = "valid-refresh-token";

    it("deve buscar usuário por refresh token", async () => {
      const mockUserData = {
        _id: "user-id-123",
        name: "usuario123",
        password: "hashedPassword",
        refreshToken,
      };
      mockUser.findOne.mockResolvedValue(mockUserData);

      const res = await getUserByRefreshToken(refreshToken);
      expect(mockUser.findOne).toHaveBeenCalledWith({ refreshToken }, { __v: 0 });
      expect(res).toEqual(mockUserData);
    });

    it("deve retornar null quando refresh token não encontrado", async () => {
      mockUser.findOne.mockResolvedValue(null);

      const res = await getUserByRefreshToken("invalid-token");
      expect(mockUser.findOne).toHaveBeenCalledWith({ refreshToken: "invalid-token" }, { __v: 0 });
      expect(res).toBeNull();
    });

    it("deve usar projeção correta excluindo __v", async () => {
      mockUser.findOne.mockResolvedValue({});
      await getUserByRefreshToken(refreshToken);
      expect(mockUser.findOne).toHaveBeenCalledWith({ refreshToken }, { __v: 0 });
    });

    it("deve propagar erro do banco de dados", async () => {
      const dbError = new Error("Erro de conexão com o banco");
      mockUser.findOne.mockRejectedValue(dbError);
      await expect(getUserByRefreshToken(refreshToken)).rejects.toThrow(dbError);
    });
  });

  describe("updateUserRefreshToken", () => {
    const userID = "user-id-123";
    const refreshToken = "new-refresh-token";

    it("deve atualizar refresh token do usuário", async () => {
      const updatedUser = {
        _id: userID,
        name: "usuario123",
        refreshToken,
      };
      mockUser.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const res = await updateUserRefreshToken(userID, refreshToken);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userID, { refreshToken }, { new: true });
      expect(res).toEqual(updatedUser);
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      mockUser.findByIdAndUpdate.mockResolvedValue(null);
      const res = await updateUserRefreshToken("invalid-id", refreshToken);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith("invalid-id", { refreshToken }, { new: true });
      expect(res).toBeNull();
    });

    it("deve usar opção new: true para retornar documento atualizado", async () => {
      mockUser.findByIdAndUpdate.mockResolvedValue({});
      await updateUserRefreshToken(userID, refreshToken);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userID, { refreshToken }, { new: true });
    });

    it("deve aceitar diferentes tipos de refresh token", async () => {
      const longToken = "very-long-refresh-token-with-many-characters";
      mockUser.findByIdAndUpdate.mockResolvedValue({});

      await updateUserRefreshToken(userID, longToken);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userID, { refreshToken: longToken }, { new: true });
    });

    it("deve propagar erro do banco de dados", async () => {
      const dbError = new Error("Erro de atualização");
      mockUser.findByIdAndUpdate.mockRejectedValue(dbError);
      await expect(updateUserRefreshToken(userID, refreshToken)).rejects.toThrow(dbError);
    });
  });

  describe("removeRefreshToken", () => {
    const userID = "user-id-123";

    it("deve remover refresh token do usuário", async () => {
      const updatedUser = {
        _id: userID,
        name: "usuario123",
        refreshToken: null as string | null,
      };
      mockUser.findByIdAndUpdate.mockResolvedValue(updatedUser);
      const res = await removeRefreshToken(userID);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userID, { refreshToken: null });
      expect(res).toEqual(updatedUser);
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      mockUser.findByIdAndUpdate.mockResolvedValue(null);
      const res = await removeRefreshToken("invalid-id");
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith("invalid-id", { refreshToken: null });
      expect(res).toBeNull();
    });

    it("deve definir refreshToken como null", async () => {
      mockUser.findByIdAndUpdate.mockResolvedValue({});
      await removeRefreshToken(userID);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userID, { refreshToken: null });
    });

    it("deve propagar erro do banco de dados", async () => {
      const dbError = new Error("Erro de remoção");
      mockUser.findByIdAndUpdate.mockRejectedValue(dbError);
      await expect(removeRefreshToken(userID)).rejects.toThrow(dbError);
    });

    it("deve funcionar para diferentes tipos de userID", async () => {
      const objectIdString = "507f1f77bcf86cd799439011";
      mockUser.findByIdAndUpdate.mockResolvedValue({});

      await removeRefreshToken(objectIdString);
      expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(objectIdString, { refreshToken: null });
    });
  });
});
