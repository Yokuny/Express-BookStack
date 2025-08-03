import request from "supertest";
import { createTestApp, createTestUser } from "./helpers/testHelpers";

describe("Auth Routes", () => {
  const app = createTestApp();

  describe("POST /auth/signin", () => {
    it("deve fazer login com credenciais válidas", async () => {
      const { userData } = await createTestUser(app);
      const res = await request(app).post("/auth/signin").send(userData);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      expect(res.headers["set-cookie"]).toBeDefined();
      const cookieHeader = res.headers["set-cookie"][0];
      expect(cookieHeader).toContain("refreshToken=");
    });

    it("deve retornar erro para credenciais inválidas", async () => {
      const userData = { name: "bbbbbb11", password: "bbbbbb11" };
      const res = await request(app).post("/auth/signin").send(userData);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Usuário não encontrado");
    });

    it("deve retornar erro para senha incorreta", async () => {
      const { userData } = await createTestUser(app);
      const res = await request(app).post("/auth/signin").send({
        name: userData.name,
        password: "bbbbbb33",
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Usuário ou senha incorretos");
    });

    it("deve retornar erro para dados inválidos", async () => {
      const userData = { name: "aa", password: "aa" };
      const res = await request(app).post("/auth/signin").send(userData);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /auth/refresh", () => {
    it("deve renovar accessToken com refreshToken válido", async () => {
      const { userData } = await createTestUser(app);
      const loginRes = await request(app).post("/auth/signin").send(userData);
      const setCookieHeader = loginRes.headers["set-cookie"][0];
      const refreshToken = setCookieHeader.split("refreshToken=")[1].split(";")[0];

      const res = await request(app).post("/auth/refresh").set("Cookie", `refreshToken=${refreshToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("deve retornar erro para refreshToken inválido", async () => {
      const res = await request(app).post("/auth/refresh").set("Cookie", "refreshToken=invalid_token");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("deve retornar erro quando refreshToken não é fornecido", async () => {
      const res = await request(app).post("/auth/refresh");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Acesso inválido");
    });
  });

  describe("POST /auth/logout", () => {
    it("deve fazer logout com refreshToken válido", async () => {
      const { userData } = await createTestUser(app);
      const loginRes = await request(app).post("/auth/signin").send(userData);
      const setCookieHeader = loginRes.headers["set-cookie"][0];
      const refreshToken = setCookieHeader.split("refreshToken=")[1].split(";")[0];
      const res = await request(app).post("/auth/logout").set("Cookie", `refreshToken=${refreshToken}`);
      expect(res.status).toBe(204);
    });

    it("deve retornar erro para refreshToken inválido", async () => {
      const res = await request(app).post("/auth/logout").set("Cookie", "refreshToken=invalid_token");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
