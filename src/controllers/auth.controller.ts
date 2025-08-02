import type { NextFunction, Request, Response } from "express";
import { clearCookieOptions, cookieOptions } from "../config/cookie.config";
import { respObj } from "../helpers/responsePattern.helper";
import type { AuthReq } from "../models/interfaces.type";
import * as service from "../service/auth.service";

export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body, name: req.body.name.toLowerCase() };
    const resp = await service.signin(data);

    res.cookie("refreshToken", resp.refreshToken, cookieOptions);

    res.status(200).json(respObj({ data: { accessToken: resp.accessToken } }));
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const newAccessToken = res.locals.newAccessToken;

    res.status(200).json(
      respObj({
        data: {
          accessToken: newAccessToken,
          message: "Token renovado com sucesso",
        },
      }),
    );
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthReq, res: Response, next: NextFunction) => {
  try {
    const resp = await service.logout(req);

    res.clearCookie("refreshToken", clearCookieOptions);
    res.status(204).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};
