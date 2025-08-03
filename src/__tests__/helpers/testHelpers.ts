import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOptions } from "../../config/cors.config";
import { errorHandler } from "../../middlewares/errorHandler.middleware";
import { authRoute } from "../../routes/auth.route";
import { userRoute } from "../../routes/user.route";
import { bookRoute } from "../../routes/book.route";

export const createTestApp = () => {
  const app = express();
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());
  app.use("/auth", authRoute);
  app.use("/user", userRoute);
  app.use("/books", bookRoute);
  app.use(errorHandler);
  return app;
};

export const createTestUser = async (app: express.Application) => {
  const userData = { name: "aaaaaa11", password: "aaaaaa11" };
  const res = await request(app).post("/user/signup").send(userData);
  return { userData, response: res };
};

export const loginTestUser = async (app: express.Application, userData: { name: string; password: string }) => {
  const res = await request(app).post("/auth/signin").send(userData);
  return res;
};

export const createTestBook = async (app: express.Application, token: string) => {
  const bookData = {
    isbn: "9783717523000",
    name: "Dom Casmurro",
    description:
      "Dom Casmurro é um romance de Machado de Assis, publicado em 1899. O livro conta a história de João Murtas, um jovem que se casa com a bela e misteriosa Capitu, mas sofre com a suspeita de infidelidade de sua esposa.",
    author: "Machado de Assis",
    stock: 10,
  };

  const res = await request(app).post("/books").set("Authorization", `Bearer ${token}`).send(bookData);
  return { bookData, response: res };
};
