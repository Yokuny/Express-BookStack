import express from "express";
import request from "supertest";
import { errorHandler } from "../middlewares/errorHandler.middleware";
import { createTestApp, createTestUser, loginTestUser } from "./helpers/testHelpers";

describe("Middlewares", () => {
  const app = createTestApp();

  describe("Authentication Middleware", () => {
    describe("validToken", () => {
      it("deve permitir acesso com token válido", async () => {
        const { userData } = await createTestUser(app);
        const loginRes = await loginTestUser(app, userData);
        const accessToken = loginRes.body.data.accessToken;
        const res = await request(app).get("/books").set("Authorization", `Bearer ${accessToken}`);
        expect(res.status).not.toBe(401);
      });

      it("deve retornar erro 401 sem token", async () => {
        const res = await request(app).get("/books");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Acesso inválido");
      });

      it("deve retornar erro 401 com token inválido", async () => {
        const res = await request(app).get("/books").set("Authorization", "Bearer invalid_token");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Token inválido");
      });

      it("deve retornar erro 401 com formato de header inválido", async () => {
        const res = await request(app).get("/books").set("Authorization", "invalid_format");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Token inválido");
      });
    });

    describe("validRefreshToken", () => {
      it("deve validar refreshToken correto", async () => {
        const { userData } = await createTestUser(app);
        const loginRes = await loginTestUser(app, userData);
        const setCookieHeader = loginRes.headers["set-cookie"][0];
        const refreshToken = setCookieHeader.split("refreshToken=")[1].split(";")[0];
        const res = await request(app).post("/auth/refresh").set("Cookie", `refreshToken=${refreshToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it("deve retornar erro para refreshToken inválido", async () => {
        const res = await request(app).post("/auth/refresh").set("Cookie", "refreshToken=invalid_token");
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });

  describe("Validation Middleware", () => {
    it("deve validar dados corretos do usuário", async () => {
      const userData = { name: "aaaaaa11", password: "aaaaaa11" };
      const res = await request(app).post("/user/signup").send(userData);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("deve retornar erro para dados inválidos", async () => {
      const userData = { name: "aa", password: "aa" };
      const res = await request(app).post("/user/signup").send(userData);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("deve retornar erro para senha sem letras e números", async () => {
      const userData = { name: "aaaaaaaaa", password: "aaaaaaaaa" };
      const res = await request(app).post("/user/signup").send(userData);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Error Handler Middleware", () => {
    const app = express();
    app.use(express.json());
    app.get("/test-error", () => {
      throw new Error("Erro de teste");
    });
    app.use(errorHandler);

    it("deve tratar erros e retornar resposta formatada", async () => {
      const res = await request(app).get("/test-error");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Erro de teste");
    });
  });
});
