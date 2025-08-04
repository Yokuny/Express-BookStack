import type { NextFunction, Response } from "express";
import { createBook, deleteBook, getBookByIsbn, getBooks, toggleFavoriteBook, updateBook } from "../../../controllers/book.controller";
import { respObj } from "../../../helpers/responsePattern.helper";
import type { AuthReq } from "../../../models/interfaces.type";
import * as bookService from "../../../service/book.service";

jest.mock("../../../service/book.service");
jest.mock("../../../helpers/responsePattern.helper");

describe("Book Controller", () => {
  let mockAuthRequest: Partial<AuthReq>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  const mockBookService = bookService as jest.Mocked<typeof bookService>;
  const mockRespObj = respObj as jest.MockedFunction<typeof respObj>;

  beforeEach(() => {
    mockAuthRequest = {
      user: "user-id-123",
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
    mockRespObj.mockReturnValue({ success: true, data: {}, message: "" });
  });

  describe("createBook", () => {
    it("deve criar um livro com sucesso", async () => {
      const bookData = {
        isbn: "9783717523000",
        name: "Dom Casmurro",
        author: "Machado de Assis",
        stock: 10,
      };
      const mockServiceResponse = { message: "Livro adicionado com sucesso" };
      mockAuthRequest.body = bookData;
      mockBookService.createBook.mockResolvedValue(mockServiceResponse);

      await createBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.createBook).toHaveBeenCalledWith(bookData, "user-id-123");
      expect(mockRespObj).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando service lança erro", async () => {
      const error = new Error("ISBN duplicado");
      mockAuthRequest.body = { isbn: "123", name: "Livro" };
      mockBookService.createBook.mockRejectedValue(error);

      await createBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("getBooks", () => {
    it("deve listar livros com sucesso", async () => {
      const mockBooks = {
        data: {
          books: [{ isbn: "123", name: "Livro 1" }],
          pagination: { totalCount: 1, page: 1 },
        },
      };
      const queryParams = { search: "Dom", page: "1" };
      mockAuthRequest.query = queryParams;
      mockBookService.getAllBooksByUser.mockResolvedValue(mockBooks);

      await getBooks(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.getAllBooksByUser).toHaveBeenCalledWith("user-id-123", queryParams);
      expect(mockRespObj).toHaveBeenCalledWith(mockBooks);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve listar livros sem query params", async () => {
      const mockBooks = { data: { books: [] as any[], pagination: { totalCount: 0 } } };
      mockAuthRequest.query = {};
      mockBookService.getAllBooksByUser.mockResolvedValue(mockBooks);

      await getBooks(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.getAllBooksByUser).toHaveBeenCalledWith("user-id-123", {});
      expect(mockRespObj).toHaveBeenCalledWith(mockBooks);
    });

    it("deve passar filtro de favoritos para o service", async () => {
      const mockBooks = { data: { books: [] as any[], pagination: { totalCount: 0 } } };
      const queryParams = { favorites: "true", page: "1", limit: "10" };
      mockAuthRequest.query = queryParams;
      mockBookService.getAllBooksByUser.mockResolvedValue(mockBooks);

      await getBooks(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.getAllBooksByUser).toHaveBeenCalledWith("user-id-123", queryParams);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve passar filtro de não favoritos para o service", async () => {
      const mockBooks = { data: { books: [] as any[], pagination: { totalCount: 0 } } };
      const queryParams = { favorites: "false", search: "Dom" };
      mockAuthRequest.query = queryParams;
      mockBookService.getAllBooksByUser.mockResolvedValue(mockBooks);

      await getBooks(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.getAllBooksByUser).toHaveBeenCalledWith("user-id-123", queryParams);
      expect(mockRespObj).toHaveBeenCalledWith(mockBooks);
    });

    it("deve combinar filtros de busca e favoritos", async () => {
      const mockBooks = { data: { books: [] as any[], pagination: { totalCount: 0 } } };
      const queryParams = { search: "Dom", favorites: "1", page: "2" };
      mockAuthRequest.query = queryParams;
      mockBookService.getAllBooksByUser.mockResolvedValue(mockBooks);

      await getBooks(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.getAllBooksByUser).toHaveBeenCalledWith("user-id-123", queryParams);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("deve chamar next() quando service lança erro", async () => {
      const error = new Error("Erro ao buscar livros");
      mockBookService.getAllBooksByUser.mockRejectedValue(error);

      await getBooks(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getBookByIsbn", () => {
    it("deve retornar livro específico com sucesso", async () => {
      const isbn = "9783717523000";
      const mockBook = { isbn, name: "Dom Casmurro", author: "Machado de Assis" } as any;
      mockAuthRequest.params = { isbn };
      mockBookService.getBookByIsbn.mockResolvedValue(mockBook);

      await getBookByIsbn(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.getBookByIsbn).toHaveBeenCalledWith(isbn, "user-id-123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockBook });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando livro não encontrado", async () => {
      const isbn = "9999999999";
      const error = new Error("Livro não encontrado");
      mockAuthRequest.params = { isbn };
      mockBookService.getBookByIsbn.mockRejectedValue(error);

      await getBookByIsbn(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("updateBook", () => {
    it("deve atualizar livro com sucesso", async () => {
      const isbn = "9783717523000";
      const updateData = { name: "Novo Nome", stock: 15 };
      const mockServiceResponse = {
        data: { isbn, name: "Novo Nome", stock: 15 },
        message: "Livro atualizado com sucesso",
      };
      mockAuthRequest.params = { isbn };
      mockAuthRequest.body = updateData;
      mockBookService.updateBook.mockResolvedValue(mockServiceResponse);

      await updateBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.updateBook).toHaveBeenCalledWith(isbn, "user-id-123", updateData);
      expect(mockRespObj).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando livro não encontrado", async () => {
      const isbn = "9999999999";
      const error = new Error("Livro não encontrado");
      mockAuthRequest.params = { isbn };
      mockAuthRequest.body = { name: "Novo Nome" };
      mockBookService.updateBook.mockRejectedValue(error);

      await updateBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteBook", () => {
    it("deve deletar livro com sucesso", async () => {
      const isbn = "9783717523000";
      const mockServiceResponse = { message: "Livro removido com sucesso" };
      mockAuthRequest.params = { isbn };
      mockBookService.deleteBook.mockResolvedValue(mockServiceResponse);

      await deleteBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.deleteBook).toHaveBeenCalledWith(isbn, "user-id-123");
      expect(mockRespObj).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando livro não encontrado", async () => {
      const isbn = "9999999999";
      const error = new Error("Livro não encontrado");
      mockAuthRequest.params = { isbn };
      mockBookService.deleteBook.mockRejectedValue(error);

      await deleteBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("toggleFavoriteBook", () => {
    it("deve alternar favorito com sucesso", async () => {
      const isbn = "9783717523000";
      const mockServiceResponse = {
        data: { isbn, isFavorite: true },
        message: "Livro adicionado aos favoritos com sucesso",
      };
      mockAuthRequest.params = { isbn };
      mockBookService.toggleFavoriteBook.mockResolvedValue(mockServiceResponse);

      await toggleFavoriteBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.toggleFavoriteBook).toHaveBeenCalledWith(isbn, "user-id-123");
      expect(mockRespObj).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando livro não encontrado", async () => {
      const isbn = "9999999999";
      const error = new Error("Livro não encontrado");
      mockAuthRequest.params = { isbn };
      mockBookService.toggleFavoriteBook.mockRejectedValue(error);

      await toggleFavoriteBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("deve passar parâmetros corretos para o service", async () => {
      const isbn = "1234567890";
      const userID = "test-user-id";
      mockAuthRequest.params = { isbn };
      mockAuthRequest.user = userID;
      mockBookService.toggleFavoriteBook.mockResolvedValue({
        data: { isbn, isFavorite: false },
        message: "Livro removido dos favoritos",
      });

      await toggleFavoriteBook(mockAuthRequest as AuthReq, mockResponse as Response, mockNext);
      expect(mockBookService.toggleFavoriteBook).toHaveBeenCalledWith(isbn, userID);
    });
  });
});
