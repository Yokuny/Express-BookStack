import request from "supertest";
import { createTestApp } from "./helpers/testHelpers";

describe("User Routes", () => {
  const app = createTestApp();

  describe("POST /user/signup", () => {
    it("deve criar um novo usuário com dados válidos", async () => {
      const userData = { name: "aaaaaa11", password: "aaaaaa11" };
      const res = await request(app).post("/user/signup").send(userData);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Usuário criado com sucesso");
    });

    it("deve retornar erro para dados inválidos", async () => {
      const userData = { name: "aa", password: "aa" };
      const res = await request(app).post("/user/signup").send(userData);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("deve retornar erro para usuário duplicado", async () => {
      const userData = { name: "bbbbbb22", password: "bbbbbb22" };
      await request(app).post("/user/signup").send(userData);
      const res = await request(app).post("/user/signup").send(userData);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Usuário já existe");
    });
  });

  describe("POST /user/guest", () => {
    it("deve criar uma conta de visitante e retornar accessToken", async () => {
      const res = await request(app).post("/user/guest");
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.message).toBe("Conta de visitante criada com sucesso");
      expect(res.headers["set-cookie"]).toBeDefined();
      const cookieHeader = res.headers["set-cookie"][0];
      expect(cookieHeader).toContain("refreshToken=");
    });

    it("deve criar múltiplas contas de visitante sem conflito", async () => {
      const firstRes = await request(app).post("/user/guest");
      const secondRes = await request(app).post("/user/guest");
      expect(firstRes.status).toBe(201);
      expect(secondRes.status).toBe(201);
      expect(firstRes.body.data.accessToken).not.toBe(secondRes.body.data.accessToken);
    });
  });
});
