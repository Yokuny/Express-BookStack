import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, json, type Request, type Response, urlencoded } from "express";

import { corsOptions, dbConnect } from "./config";

const app: Application = express();

app
  .use(urlencoded({ extended: false }))
  .use(json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .get("/", (_req: Request, res: Response) => {
    res.send(new Date());
  });

app.use("*", (_req: Request, res: Response) => {
  res.status(404).send({ message: "Rota não encontrada! 🤷‍♂️" });
});

export function init(): Promise<express.Application> {
  dbConnect();
  return Promise.resolve(app);
}

export default app;
