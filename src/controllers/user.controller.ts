import type { NextFunction, Request, Response } from "express";
import { cookieOptions } from "../config/cookie.config";
import { respObj } from "../helpers/responsePattern.helper";
import * as service from "../service/user.service";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body, name: req.body.name.toLowerCase() };
    const resp = await service.signup(data);

    res.status(201).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};

export const createGuestAccount = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resp = await service.createGuestAccount();

    res.cookie("refreshToken", resp.refreshToken, cookieOptions);
    res.status(201).json(
      respObj({
        data: { accessToken: resp.accessToken },
        message: "Conta de visitante criada com sucesso",
      }),
    );
  } catch (err) {
    next(err);
  }
};
