import { Book } from "../../../database/book.database";
import type { BookCreateData } from "../../../models/interfaces.type";
import { createBook, deleteBook, getAllBooksByUser, getBookByIsbn, toggleFavoriteBook, updateBook } from "../../../repositories/book.repository";
import type { BookQuery } from "../../../schemas/bookQuery.schema";

jest.mock("../../../database/book.database");

describe("Book Repository", () => {
  const mockBook = Book as jest.Mocked<typeof Book>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBook", () => {
    it("deve criar um novo livro no banco", async () => {
      const bookData: BookCreateData = {
        isbn: "9783717523000",
        name: "Dom Casmurro",
        author: "Machado de Assis",
        description: "Romance clássico",
        stock: 10,
        userID: "user-id-123",
      };

      const createdBook = { _id: "book-id", ...bookData };
      mockBook.create.mockResolvedValue(createdBook as any);

      const res = await createBook(bookData);
      expect(mockBook.create).toHaveBeenCalledWith(bookData);
      expect(res).toEqual(createdBook);
    });

    it("deve propagar erro de validação do banco", async () => {
      const invalidBookData = { isbn: "", name: "" } as BookCreateData;
      const validationError = new Error("Validation failed");
      mockBook.create.mockRejectedValue(validationError);

      await expect(createBook(invalidBookData)).rejects.toThrow(validationError);
    });

    it("deve propagar erro de duplicação de ISBN", async () => {
      const bookData: BookCreateData = {
        isbn: "9783717523000",
        name: "Livro Duplicado",
        author: "Autor",
        description: "Descrição do livro",
        stock: 5,
        userID: "user-id-123",
      };

      const duplicateError = new Error("E11000 duplicate key error");
      mockBook.create.mockRejectedValue(duplicateError);
      await expect(createBook(bookData)).rejects.toThrow(duplicateError);
    });
  });

  describe("getBookByIsbn", () => {
    const isbn = "9783717523000";
    const userID = "user-id-123";
    const projection = { _id: 0, __v: 0, userID: 0 };

    it("deve buscar livro por ISBN e userID", async () => {
      const mockBookData = {
        isbn,
        name: "Dom Casmurro",
        author: "Machado de Assis",
        stock: 10,
      };
      mockBook.findOne.mockResolvedValue(mockBookData as any);

      const res = await getBookByIsbn(isbn, userID);
      expect(mockBook.findOne).toHaveBeenCalledWith({ isbn, userID }, projection);
      expect(res).toEqual(mockBookData);
    });

    it("deve retornar null quando livro não encontrado", async () => {
      mockBook.findOne.mockResolvedValue(null);

      const res = await getBookByIsbn("invalid-isbn", userID);
      expect(mockBook.findOne).toHaveBeenCalledWith({ isbn: "invalid-isbn", userID }, projection);
      expect(res).toBeNull();
    });

    it("deve usar projeção correta excluindo campos internos", async () => {
      mockBook.findOne.mockResolvedValue({} as any);

      await getBookByIsbn(isbn, userID);
      expect(mockBook.findOne).toHaveBeenCalledWith({ isbn, userID }, { _id: 0, __v: 0, userID: 0 });
    });
  });

  describe("getAllBooksByUser", () => {
    const userID = "user-id-123";

    it("deve buscar livros com paginação", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "" };
      const mockBooks = [
        { name: "Livro 1", author: "Autor 1", isbn: "123" },
        { name: "Livro 2", author: "Autor 2", isbn: "456" },
      ];
      const totalCount = 2;

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(Promise.resolve(mockBooks)),
      };

      mockBook.find.mockReturnValue(mockFind as any);
      mockBook.countDocuments.mockResolvedValue(totalCount);

      const res = await getAllBooksByUser(userID, bookQuery);
      expect(mockBook.find).toHaveBeenCalledWith({ userID });
      expect(mockFind.select).toHaveBeenCalledWith("-_id name author isbn stock isFavorite");
      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(mockBook.countDocuments).toHaveBeenCalledWith({ userID });
      expect(res).toEqual({
        books: mockBooks,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it("deve aplicar filtro de busca quando fornecido", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "Dom" };
      const expectedFilter = {
        userID,
        $or: [
          { name: { $regex: "Dom", $options: "i" } },
          { author: { $regex: "Dom", $options: "i" } },
          { isbn: { $regex: "Dom", $options: "i" } },
          { description: { $regex: "Dom", $options: "i" } },
        ],
      };
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(Promise.resolve([])),
      };
      mockBook.find.mockReturnValue(mockFind as any);
      mockBook.countDocuments.mockResolvedValue(0);

      await getAllBooksByUser(userID, bookQuery);
      expect(mockBook.find).toHaveBeenCalledWith(expectedFilter);
      expect(mockBook.countDocuments).toHaveBeenCalledWith(expectedFilter);
    });

    it("deve calcular paginação corretamente", async () => {
      const bookQuery: BookQuery = { page: 2, limit: 5, search: "" };
      const totalCount = 12;

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(Promise.resolve([])),
      };
      mockBook.find.mockReturnValue(mockFind as any);
      mockBook.countDocuments.mockResolvedValue(totalCount);

      const res = await getAllBooksByUser(userID, bookQuery);
      expect(mockFind.skip).toHaveBeenCalledWith(5);
      expect(mockFind.limit).toHaveBeenCalledWith(5);
      expect(res.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalCount: 12,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it("deve usar Promise.all para buscar livros e contagem em paralelo", async () => {
      const bookQuery: BookQuery = { page: 1, limit: 10, search: "" };
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(Promise.resolve([])),
      };
      mockBook.find.mockReturnValue(mockFind as any);
      mockBook.countDocuments.mockResolvedValue(0);

      await getAllBooksByUser(userID, bookQuery);
      expect(mockBook.find).toHaveBeenCalled();
      expect(mockBook.countDocuments).toHaveBeenCalled();
    });
  });

  describe("updateBook", () => {
    const isbn = "9783717523000";
    const userID = "user-id-123";
    const projection = { _id: 0, __v: 0, userID: 0 };

    it("deve atualizar livro existente", async () => {
      const updateData = { name: "Novo Nome", stock: 15 };
      const updatedBook = { isbn, name: "Novo Nome", stock: 15 };
      mockBook.findOneAndUpdate.mockResolvedValue(updatedBook as any);

      const res = await updateBook(isbn, userID, updateData);
      expect(mockBook.findOneAndUpdate).toHaveBeenCalledWith({ isbn, userID }, updateData, { new: true, projection });
      expect(res).toEqual(updatedBook);
    });

    it("deve retornar null quando livro não encontrado", async () => {
      const updateData = { name: "Novo Nome" };
      mockBook.findOneAndUpdate.mockResolvedValue(null);

      const res = await updateBook("invalid-isbn", userID, updateData);
      expect(res).toBeNull();
    });

    it("deve usar opções corretas (new: true, projection)", async () => {
      const updateData = { stock: 20 };
      mockBook.findOneAndUpdate.mockResolvedValue({} as any);
      await updateBook(isbn, userID, updateData);
      expect(mockBook.findOneAndUpdate).toHaveBeenCalledWith({ isbn, userID }, updateData, { new: true, projection });
    });
  });

  describe("deleteBook", () => {
    const isbn = "9783717523000";
    const userID = "user-id-123";

    it("deve deletar livro existente", async () => {
      const deletedBook = { isbn, name: "Livro Deletado" };
      mockBook.findOneAndDelete.mockResolvedValue(deletedBook as any);

      const res = await deleteBook(isbn, userID);
      expect(mockBook.findOneAndDelete).toHaveBeenCalledWith({ isbn, userID });
      expect(res).toEqual(deletedBook);
    });

    it("deve retornar null quando livro não encontrado", async () => {
      mockBook.findOneAndDelete.mockResolvedValue(null);

      const res = await deleteBook("invalid-isbn", userID);
      expect(mockBook.findOneAndDelete).toHaveBeenCalledWith({
        isbn: "invalid-isbn",
        userID,
      });
      expect(res).toBeNull();
    });

    it("deve deletar apenas livro do usuário específico", async () => {
      const specificUserID = "specific-user-123";
      mockBook.findOneAndDelete.mockResolvedValue({} as any);

      await deleteBook(isbn, specificUserID);
      expect(mockBook.findOneAndDelete).toHaveBeenCalledWith({
        isbn,
        userID: specificUserID,
      });
    });
  });

  describe("toggleFavoriteBook", () => {
    const isbn = "9783717523000";
    const userID = "user-id-123";
    const projection = { _id: 0, __v: 0, userID: 0 };

    it("deve marcar livro como favorito", async () => {
      const isFavorite = true;
      const updatedBook = { isbn, name: "Dom Casmurro", isFavorite: true };
      mockBook.findOneAndUpdate.mockResolvedValue(updatedBook as any);

      const res = await toggleFavoriteBook(isbn, userID, isFavorite);
      expect(mockBook.findOneAndUpdate).toHaveBeenCalledWith({ isbn, userID }, { isFavorite }, { new: true, projection });
      expect(res).toEqual(updatedBook);
    });

    it("deve desmarcar livro como favorito", async () => {
      const isFavorite = false;
      const updatedBook = { isbn, name: "Dom Casmurro", isFavorite: false };
      mockBook.findOneAndUpdate.mockResolvedValue(updatedBook as any);

      const res = await toggleFavoriteBook(isbn, userID, isFavorite);
      expect(mockBook.findOneAndUpdate).toHaveBeenCalledWith({ isbn, userID }, { isFavorite }, { new: true, projection });
      expect(res).toEqual(updatedBook);
    });

    it("deve retornar null quando livro não encontrado", async () => {
      mockBook.findOneAndUpdate.mockResolvedValue(null);
      const res = await toggleFavoriteBook("invalid-isbn", userID, true);
      expect(res).toBeNull();
    });

    it("deve usar opções corretas (new: true, projection)", async () => {
      mockBook.findOneAndUpdate.mockResolvedValue({} as any);

      await toggleFavoriteBook(isbn, userID, true);
      expect(mockBook.findOneAndUpdate).toHaveBeenCalledWith({ isbn, userID }, { isFavorite: true }, { new: true, projection });
    });
  });
});
