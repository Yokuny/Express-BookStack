import type { ServiceRes } from "../helpers/responsePattern.helper";
import { returnData, returnDataMessage, returnMessage } from "../helpers/responsePattern.helper";
import type { BookCreateData, BookData } from "../models";
import { CustomError } from "../models/error.type";
import * as repository from "../repositories/book.repository";

export const getBookByIsbn = async (isbn: string, userID: string, required: boolean = true) => {
  const book = await repository.getBookByIsbn(isbn, userID);
  if (!book && required) throw new CustomError("Livro não encontrado", 404);
  return book;
};

export const createBook = async (data: BookData, userID: string): Promise<ServiceRes> => {
  const existingBook = await getBookByIsbn(data.isbn, userID, false);
  if (existingBook) throw new CustomError("Você já possui um livro com este ISBN", 409);

  const bookCreateData: BookCreateData = { ...data, userID };
  await repository.createBook(bookCreateData);
  return returnMessage("Livro adicionado com sucesso");
};

export const getAllBooksByUser = async (userID: string): Promise<ServiceRes> => {
  const books = await repository.getAllBooksByUser(userID);
  return returnData(books);
};

export const updateBook = async (isbn: string, userID: string, data: Partial<BookData>): Promise<ServiceRes> => {
  await getBookByIsbn(isbn, userID);
  const { isbn: _, ...bookUpdateData } = data;
  const updatedBook = await repository.updateBook(isbn, userID, bookUpdateData);

  return returnDataMessage(updatedBook, "Livro atualizado com sucesso");
};

export const deleteBook = async (isbn: string, userID: string): Promise<ServiceRes> => {
  await getBookByIsbn(isbn, userID);
  await repository.deleteBook(isbn, userID);

  return returnMessage("Livro removido com sucesso");
};
