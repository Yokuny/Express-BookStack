import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { validBody, validRefreshToken } from "../middlewares";
import { userAcessSchema } from "../schemas/user.schema";

const authRoute = Router();

authRoute.post("/signin", validBody(userAcessSchema), controller.signin);
authRoute.post("/refresh", validRefreshToken, controller.refreshToken);
authRoute.post("/logout", validRefreshToken, controller.logout);

export { authRoute };
