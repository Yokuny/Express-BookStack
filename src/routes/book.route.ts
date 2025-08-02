import { Router } from "express";
import * as controller from "../controllers/book.controller";
import { validBody, validParams, validQuery, validToken } from "../middlewares";
import { bookParamsSchema, bookSchema, bookUpdateSchema } from "../schemas/book.schema";
import { bookQuerySchema } from "../schemas/bookQuery.schema";

const bookRoute = Router();

bookRoute.use(validToken);

bookRoute.post("/", validBody(bookSchema), controller.createBook);
bookRoute.get("/", validQuery(bookQuerySchema), controller.getBooks);
bookRoute.get("/:isbn", validParams(bookParamsSchema), controller.getBookByIsbn);
bookRoute.put("/:isbn", validParams(bookParamsSchema), validBody(bookUpdateSchema), controller.updateBook);
bookRoute.patch("/:isbn/favorite", validParams(bookParamsSchema), controller.toggleFavoriteBook);
bookRoute.delete("/:isbn", validParams(bookParamsSchema), controller.deleteBook);

export { bookRoute };
