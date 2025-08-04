import { CustomError } from "../../../models/error.type";
import type { BookCreateData } from "../../../models/interfaces.type";
import * as bookRepository from "../../../repositories/book.repository";
import type { BookData } from "../../../schemas/book.schema";
import type { BookQuery } from "../../../schemas/bookQuery.schema";
import { createBook, deleteBook, getAllBooksByUser, getBookByIsbn, toggleFavoriteBook, updateBook } from "../../../service/book.service";

jest.mock("../../../repositories/book.repository");

describe("Book Service", () => {
  const mockBookRepository = bookRepository as jest.Mocked<typeof bookRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBookByIsbn", () => {
    const isbn = "9783717523000";
    const userID = "user-123";

    it("deve retornar livro quando encontrado", async () => {
      const mockBook = {
        isbn,
        name: "Dom Casmurro",
        author: "Machado de Assis",
        stock: 10,
        isFavorite: false,
      };
      mockBookRepository.getBookByIsbn.mockResolvedValue(mockBook as any);

      const res = await getBookByIsbn(isbn, userID);
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
      expect(res).toEqual(mockBook);
    });

    it("deve lançar erro quando livro não encontrado e required=true", async () => {
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);
      await expect(getBookByIsbn(isbn, userID, true)).rejects.toThrow(new CustomError("Livro não encontrado", 404));
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
    });

    it("deve retornar null quando livro não encontrado e required=false", async () => {
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);
      const res = await getBookByIsbn(isbn, userID, false);
      expect(res).toBeNull();
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
    });

    it("deve usar required=true por padrão", async () => {
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);
      await expect(getBookByIsbn(isbn, userID)).rejects.toThrow(new CustomError("Livro não encontrado", 404));
    });
  });

  describe("createBook", () => {
    const userID = "user-123";
    const bookData: BookData = {
      isbn: "9783717523000",
      name: "Dom Casmurro",
      author: "Machado de Assis",
      description: "Romance clássico",
      stock: 10,
    };

    it("deve criar livro com sucesso", async () => {
      const expectedCreateData: BookCreateData = { ...bookData, userID };
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);
      mockBookRepository.createBook.mockResolvedValue({} as any);

      const res = await createBook(bookData, userID);
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(bookData.isbn, userID);
      expect(mockBookRepository.createBook).toHaveBeenCalledWith(expectedCreateData);
      expect(res).toEqual({ message: "Livro adicionado com sucesso" });
    });

    it("deve lançar erro quando livro já existe", async () => {
      const existingBook = { isbn: bookData.isbn, name: "Livro Existente" };
      mockBookRepository.getBookByIsbn.mockResolvedValue(existingBook as any);

      await expect(createBook(bookData, userID)).rejects.toThrow(new CustomError("Você já possui um livro com este ISBN", 409));
      expect(mockBookRepository.createBook).not.toHaveBeenCalled();
    });

    it("deve adicionar userID aos dados do livro", async () => {
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);
      mockBookRepository.createBook.mockResolvedValue({} as any);

      await createBook(bookData, userID);
      expect(mockBookRepository.createBook).toHaveBeenCalledWith({
        ...bookData,
        userID,
      });
    });
  });

  describe("getAllBooksByUser", () => {
    const userID = "user-123";

    it("deve retornar lista de livros com paginação", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "" };
      const mockres = {
        books: [
          { isbn: "123", name: "Livro 1" },
          { isbn: "456", name: "Livro 2" },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
      mockBookRepository.getAllBooksByUser.mockResolvedValue(mockres as any);

      const res = await getAllBooksByUser(userID, bookQuery);
      expect(mockBookRepository.getAllBooksByUser).toHaveBeenCalledWith(userID, bookQuery);
      expect(res).toEqual({ data: mockres });
    });

    it("deve passar query params corretamente", async () => {
      const bookQuery: BookQuery = { page: 2, limit: 5, search: "Dom" };
      mockBookRepository.getAllBooksByUser.mockResolvedValue({ books: [], pagination: {} } as any);

      await getAllBooksByUser(userID, bookQuery);
      expect(mockBookRepository.getAllBooksByUser).toHaveBeenCalledWith(userID, bookQuery);
    });

    it("deve passar filtro de favoritos para o repository", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "", favorites: true };
      const mockResult = { books: [] as any[], pagination: { totalCount: 0 } };
      mockBookRepository.getAllBooksByUser.mockResolvedValue(mockResult as any);

      const result = await getAllBooksByUser(userID, bookQuery);
      expect(mockBookRepository.getAllBooksByUser).toHaveBeenCalledWith(userID, bookQuery);
      expect(result).toEqual({ data: mockResult });
    });

    it("deve passar filtro de não favoritos para o repository", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "", favorites: false };
      const mockResult = { books: [] as any[], pagination: { totalCount: 0 } };
      mockBookRepository.getAllBooksByUser.mockResolvedValue(mockResult as any);

      const result = await getAllBooksByUser(userID, bookQuery);
      expect(mockBookRepository.getAllBooksByUser).toHaveBeenCalledWith(userID, bookQuery);
      expect(result).toEqual({ data: mockResult });
    });

    it("deve combinar busca e filtro de favoritos", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "Dom", favorites: true };
      const mockResult = { books: [] as any[], pagination: { totalCount: 0 } };
      mockBookRepository.getAllBooksByUser.mockResolvedValue(mockResult as any);

      const result = await getAllBooksByUser(userID, bookQuery);
      expect(mockBookRepository.getAllBooksByUser).toHaveBeenCalledWith(userID, bookQuery);
      expect(result).toEqual({ data: mockResult });
    });

    it("deve passar favorites undefined quando não fornecido", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "" };
      const mockResult = { books: [] as any[], pagination: { totalCount: 0 } };
      mockBookRepository.getAllBooksByUser.mockResolvedValue(mockResult as any);

      await getAllBooksByUser(userID, bookQuery);
      expect(mockBookRepository.getAllBooksByUser).toHaveBeenCalledWith(userID, bookQuery);
    });
  });

  describe("updateBook", () => {
    const isbn = "9783717523000";
    const userID = "user-123";

    it("deve atualizar livro com sucesso", async () => {
      const updateData = { name: "Novo Nome", stock: 15, isFavorite: true };
      const existingBook = { isbn, name: "Nome Antigo", stock: 10 };
      const updatedBook = { isbn, name: "Novo Nome", stock: 15, isFavorite: true };
      mockBookRepository.getBookByIsbn.mockResolvedValue(existingBook as any);
      mockBookRepository.updateBook.mockResolvedValue(updatedBook as any);

      const res = await updateBook(isbn, userID, updateData);
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
      expect(mockBookRepository.updateBook).toHaveBeenCalledWith(isbn, userID, updateData);
      expect(res).toEqual({
        data: updatedBook,
        message: "Livro atualizado com sucesso",
      });
    });

    it("deve remover campo isbn dos dados de atualização", async () => {
      const updateData = { isbn: "novo-isbn", name: "Novo Nome", stock: 15 };
      const expectedUpdateData = { name: "Novo Nome", stock: 15 };
      const existingBook = { isbn, name: "Nome Antigo" };
      mockBookRepository.getBookByIsbn.mockResolvedValue(existingBook as any);
      mockBookRepository.updateBook.mockResolvedValue({} as any);

      await updateBook(isbn, userID, updateData);
      expect(mockBookRepository.updateBook).toHaveBeenCalledWith(isbn, userID, expectedUpdateData);
    });

    it("deve lançar erro quando livro não encontrado", async () => {
      const updateData = { name: "Novo Nome" };
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);

      await expect(updateBook(isbn, userID, updateData)).rejects.toThrow(new CustomError("Livro não encontrado", 404));
      expect(mockBookRepository.updateBook).not.toHaveBeenCalled();
    });
  });

  describe("deleteBook", () => {
    const isbn = "9783717523000";
    const userID = "user-123";

    it("deve deletar livro com sucesso", async () => {
      const existingBook = { isbn, name: "Livro para deletar" };
      mockBookRepository.getBookByIsbn.mockResolvedValue(existingBook as any);
      mockBookRepository.deleteBook.mockResolvedValue({} as any);

      const res = await deleteBook(isbn, userID);
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
      expect(mockBookRepository.deleteBook).toHaveBeenCalledWith(isbn, userID);
      expect(res).toEqual({ message: "Livro removido com sucesso" });
    });

    it("deve lançar erro quando livro não encontrado", async () => {
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);

      await expect(deleteBook(isbn, userID)).rejects.toThrow(new CustomError("Livro não encontrado", 404));
      expect(mockBookRepository.deleteBook).not.toHaveBeenCalled();
    });
  });

  describe("toggleFavoriteBook", () => {
    const isbn = "9783717523000";
    const userID = "user-123";

    it("deve adicionar livro aos favoritos", async () => {
      const existingBook = { isbn, name: "Dom Casmurro", isFavorite: false };
      const updatedBook = { isbn, name: "Dom Casmurro", isFavorite: true };
      mockBookRepository.getBookByIsbn.mockResolvedValue(existingBook as any);
      mockBookRepository.toggleFavoriteBook.mockResolvedValue(updatedBook as any);

      const res = await toggleFavoriteBook(isbn, userID);
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
      expect(mockBookRepository.toggleFavoriteBook).toHaveBeenCalledWith(isbn, userID, true);
      expect(res).toEqual({
        data: { isbn, isFavorite: true },
        message: "Livro adicionado aos favoritos com sucesso",
      });
    });

    it("deve remover livro dos favoritos", async () => {
      const existingBook = { isbn, name: "Dom Casmurro", isFavorite: true };
      const updatedBook = { isbn, name: "Dom Casmurro", isFavorite: false };
      mockBookRepository.getBookByIsbn.mockResolvedValue(existingBook as any);
      mockBookRepository.toggleFavoriteBook.mockResolvedValue(updatedBook as any);

      const res = await toggleFavoriteBook(isbn, userID);
      expect(mockBookRepository.getBookByIsbn).toHaveBeenCalledWith(isbn, userID);
      expect(mockBookRepository.toggleFavoriteBook).toHaveBeenCalledWith(isbn, userID, false);
      expect(res).toEqual({
        data: { isbn, isFavorite: false },
        message: "Livro removido dos favoritos com sucesso",
      });
    });

    it("deve lançar erro quando livro não encontrado", async () => {
      mockBookRepository.getBookByIsbn.mockResolvedValue(null);
      await expect(toggleFavoriteBook(isbn, userID)).rejects.toThrow(new CustomError("Livro não encontrado", 404));
      expect(mockBookRepository.toggleFavoriteBook).not.toHaveBeenCalled();
    });

    it("deve inverter corretamente o status de favorito", async () => {
      const favoriteBook = { isbn, isFavorite: true };
      mockBookRepository.getBookByIsbn.mockResolvedValue(favoriteBook as any);
      mockBookRepository.toggleFavoriteBook.mockResolvedValue({ isbn, isFavorite: false } as any);

      await toggleFavoriteBook(isbn, userID);
      expect(mockBookRepository.toggleFavoriteBook).toHaveBeenCalledWith(isbn, userID, false);
    });
  });
});
