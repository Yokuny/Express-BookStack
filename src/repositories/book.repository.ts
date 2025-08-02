import { Book } from "../database";
import type { BookCreateData } from "../models";

const projection = { _id: 0, __v: 0, userID: 0 } as const;

export const createBook = async (data: BookCreateData) => {
  return Book.create(data);
};

export const getBookByIsbn = async (isbn: string, userID: string) => {
  return Book.findOne({ isbn, userID }, projection);
};

export const getAllBooksByUser = async (userID: string) => {
  return Book.find({ userID }, { projection: { ...projection, createdAt: 0, updatedAt: 0, description: 0 } }).sort({
    createdAt: -1,
  });
};

export const updateBook = async (isbn: string, userID: string, data: Partial<BookCreateData>) => {
  return Book.findOneAndUpdate({ isbn, userID }, data, { new: true, projection });
};

export const deleteBook = async (isbn: string, userID: string) => {
  return Book.findOneAndDelete({ isbn, userID });
};
