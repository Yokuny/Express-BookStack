import type { NextFunction, Request, Response } from "express";
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
