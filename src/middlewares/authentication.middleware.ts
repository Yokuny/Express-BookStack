import type { NextFunction, Response } from "express";
import * as jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import type { AuthReq } from "../models";
import { CustomError } from "../models/error.type";
import { getUserByRefreshToken } from "../repositories/auth.repository";
import { getUserById } from "../service/user.service";

export const validToken = async (req: AuthReq, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new CustomError("Acesso inválido", 401);

    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new CustomError("Acesso inválido", 401);

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as { user: string };
    if (!decoded.user) throw new CustomError("Acesso inválido", 401);
    const user = await getUserById(decoded.user);
    if (!user) throw new CustomError("Acesso inválido", 404);

    req.user = decoded.user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Token inválido", 401));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expirado", 401));
    }

    next(error);
  }
};

export const validRefreshToken = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new CustomError("Acesso inválido", 401);
    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as { user: string };

    if (!decoded.user) throw new CustomError("Acesso inválido", 401);
    const user = await getUserByRefreshToken(refreshToken);
    if (!user) throw new CustomError("Acesso inválido", 401);
    if (user._id.toString() !== decoded.user) throw new CustomError("Acesso inválido", 401);

    const newAccessToken = jwt.sign({ user: user._id }, env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });
    req.user = decoded.user;
    res.locals.newAccessToken = newAccessToken;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Refresh token inválido", 401));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Refresh token expirado", 401));
    }

    next(error);
  }
};
