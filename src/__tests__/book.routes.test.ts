import request from "supertest";
import { createTestApp, createTestBook, createTestUser, loginTestUser } from "./helpers/testHelpers";

describe("Book Routes", () => {
  const app = createTestApp();
  let accessToken: string;
  let userData: { name: string; password: string };

  beforeEach(async () => {
    const userResult = await createTestUser(app);
    userData = userResult.userData;
    const loginResponse = await loginTestUser(app, userData);
    accessToken = loginResponse.body.data.accessToken;
  });

  describe("POST /books", () => {
    it("deve criar um novo livro com dados válidos", async () => {
      const bookData = {
        isbn: "9783717523000",
        name: "Dom Casmurro",
        description:
          "Dom Casmurro é um romance de Machado de Assis, publicado em 1899. O livro conta a história de João Murtas, um jovem que se casa com a bela e misteriosa Capitu, mas sofre com a suspeita de infidelidade de sua esposa.",
        author: "Machado de Assis",
        stock: 10,
      };

      const res = await request(app).post("/books").set("Authorization", `Bearer ${accessToken}`).send(bookData);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Livro adicionado com sucesso");
    });

    it("deve retornar erro para dados inválidos", async () => {
      const bookData = {
        isbn: "",
        name: "",
        author: "",
        stock: -1,
      };

      const res = await request(app).post("/books").set("Authorization", `Bearer ${accessToken}`).send(bookData);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("deve retornar erro quando não autenticado", async () => {
      const bookData = {
        isbn: "9783717523000",
        name: "Dom Casmurro",
        description:
          "Dom Casmurro é um romance de Machado de Assis, publicado em 1899. O livro conta a história de João Murtas, um jovem que se casa com a bela e misteriosa Capitu, mas sofre com a suspeita de infidelidade de sua esposa.",
        author: "Machado de Assis",
        stock: 10,
      };
      const res = await request(app).post("/books").send(bookData);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /books", () => {
    it("deve listar livros do usuário", async () => {
      await createTestBook(app, accessToken);
      const res = await request(app).get("/books").set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.books)).toBe(true);
      expect(res.body.data.books.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();
    });

    it("deve retornar lista vazia quando usuário não tem livros", async () => {
      const res = await request(app).get("/books").set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.books)).toBe(true);
      expect(res.body.data.books.length).toBe(0);
      expect(res.body.data.pagination.totalCount).toBe(0);
    });

    it("deve filtrar livros por busca", async () => {
      await createTestBook(app, accessToken);
      const res = await request(app).get("/books?search=Dom").set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.books)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe("GET /books/:isbn", () => {
    it("deve retornar livro específico", async () => {
      const { bookData } = await createTestBook(app, accessToken);
      const res = await request(app).get(`/books/${bookData.isbn}`).set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isbn).toBe(bookData.isbn);
      expect(res.body.data.name).toBe(bookData.name);
    });

    it("deve retornar erro para livro não encontrado", async () => {
      const res = await request(app).get("/books/978-9999999999").set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /books/:isbn", () => {
    it("deve atualizar livro existente", async () => {
      const { bookData } = await createTestBook(app, accessToken);
      const updateData = {
        name: "Livro Atualizado",
        description: "Nova descrição",
        author: "Novo Autor",
        stock: 20,
        isFavorite: true,
      };

      const res = await request(app).put(`/books/${bookData.isbn}`).set("Authorization", `Bearer ${accessToken}`).send(updateData);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.isFavorite).toBe(true);
    });
  });

  describe("PATCH /books/:isbn/favorite", () => {
    it("deve alternar status de favorito do livro", async () => {
      const { bookData } = await createTestBook(app, accessToken);
      const res = await request(app).patch(`/books/${bookData.isbn}/favorite`).set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /books/:isbn", () => {
    it("deve deletar livro existente", async () => {
      const { bookData } = await createTestBook(app, accessToken);
      const res = await request(app).delete(`/books/${bookData.isbn}`).set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Livro removido com sucesso");
    });

    it("deve retornar erro ao tentar deletar livro não encontrado", async () => {
      const res = await request(app).delete("/books/978-9999999999").set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
