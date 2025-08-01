import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { validBody } from "../middlewares";
import { userAcessSchema } from "../schemas/user.schema";

const userRoute = Router();

userRoute.post("/signup", validBody(userAcessSchema), controller.signup);

export { userRoute };
