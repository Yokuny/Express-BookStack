import type { Request } from "express";
import type { BookData } from "../schemas/book.schema";

export type AuthReq = Request & { user: string };
export type BookCreateData = BookData & { userID: string };
export type Tokens = {
  refreshToken: string;
  accessToken: string;
};
