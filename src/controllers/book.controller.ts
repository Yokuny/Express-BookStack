import type { NextFunction, Response } from "express";
import { respObj } from "../helpers/responsePattern.helper";
import type { AuthReq } from "../models";
import * as service from "../service/book.service";

export const createBook = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const userID = req.user;
    const resp = await service.createBook(req.body, userID);

    res.status(201).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};

export const getBooks = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const userID = req.user;
    const books = await service.getAllBooksByUser(userID);

    res.status(200).json(respObj(books));
  } catch (err) {
    next(err);
  }
};

export const getBookByIsbn = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const { isbn } = req.params;
    const userID = req.user;
    const book = await service.getBookByIsbn(isbn, userID);

    res.status(200).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

export const updateBook = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const { isbn } = req.params;
    const userID = req.user;
    const resp = await service.updateBook(isbn, userID, req.body);

    res.status(200).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};

export const deleteBook = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const { isbn } = req.params;
    const userID = req.user;
    const resp = await service.deleteBook(isbn, userID);
    res.status(200).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};
