import { Router } from "express";
import * as controller from "../controllers/book.controller";
import { validBody, validParams, validToken } from "../middlewares";
import { bookParamsSchema, bookSchema, bookUpdateSchema } from "../schemas/book.schema";

const bookRoute = Router();

bookRoute.use(validToken);

bookRoute.post("/", validBody(bookSchema), controller.createBook);
bookRoute.get("/", controller.getBooks);
bookRoute.get("/:isbn", validParams(bookParamsSchema), controller.getBookByIsbn);
bookRoute.put("/:isbn", validBody(bookUpdateSchema), controller.updateBook);
bookRoute.delete("/:isbn", controller.deleteBook);

export { bookRoute };
