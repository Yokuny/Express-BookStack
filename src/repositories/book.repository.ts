import { Book } from "../database";
import type { BookCreateData } from "../models";
import type { BookQuery } from "../schemas/bookQuery.schema";

const projection = { _id: 0, __v: 0, userID: 0 } as const;

export const createBook = async (data: BookCreateData) => {
  return Book.create(data);
};

export const getBookByIsbn = async (isbn: string, userID: string) => {
  return Book.findOne({ isbn, userID }, projection);
};

export const getAllBooksByUser = async (userID: string, bookQuery: BookQuery) => {
  const { page, limit, search } = bookQuery;
  const skip = (page - 1) * limit;

  const baseFilter = { userID };
  const searchFilter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const filter = { ...baseFilter, ...searchFilter };

  const [books, totalCount] = await Promise.all([
    Book.find(filter).select("-_id name author isbn stock").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    books,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
    },
  };
};

export const updateBook = async (isbn: string, userID: string, data: Partial<BookCreateData>) => {
  return Book.findOneAndUpdate({ isbn, userID }, data, { new: true, projection });
};

export const deleteBook = async (isbn: string, userID: string) => {
  return Book.findOneAndDelete({ isbn, userID });
};
