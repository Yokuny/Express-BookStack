import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, json, type Request, type Response, urlencoded } from "express";
import { corsOptions, dbConnect } from "./config";
import { errorHandler, logger } from "./middlewares";
import * as route from "./routes";

const app: Application = express();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(logger);

app
  .use(urlencoded({ extended: false }))
  .use(json())
  .use(cookieParser())
  .get("/", (_req: Request, res: Response) => {
    res.send(new Date());
  })
  .use("/user", route.userRoute)
  .use("/auth", route.authRoute)
  .use("/books", route.bookRoute)
  .use("/logs", route.logRoute);

app.use("*", (_req: Request, res: Response) => {
  res.status(404).send({ message: "Rota não encontrada! 🤷‍♂️" });
});

app.use(errorHandler);

export function init(): Promise<express.Application> {
  dbConnect();
  return Promise.resolve(app);
}

export default app;
