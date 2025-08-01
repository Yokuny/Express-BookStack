import type { NextFunction, Request, Response } from "express";
import { badRespObj } from "../../../AcessRefreshToken/src/helpers/responsePattern.helper";
import { CustomError } from "../../../AcessRefreshToken/src/models";

// biome-ignore lint: any
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.log(err.message);
  if (err instanceof CustomError) {
    res.status(err.status).send(badRespObj({ message: err.message }));
  } else {
    const errMessage = err?.message || JSON.stringify(err, null, 2);
    res.status(500).send(badRespObj({ message: errMessage }));
  }
};
