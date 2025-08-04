import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodIssue, type ZodType } from "zod";
import { CustomError } from "../models/error.type";

const extractErrorMessage = (err: ZodIssue): string => {
  const { path, message } = err;
  const fieldPath = path.join(".");

  if (err.code === "custom") return message;
  if (path.length > 0) return `${fieldPath}: ${message}`;
  return message;
};

const validate = (schema: ZodType, type: "body" | "params" | "query") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req[type]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const errMessage = extractErrorMessage(firstError);
        next(new CustomError(errMessage, 400));
      } else {
        next(new CustomError("Erro de validação", 400));
      }
    }
  };
};

export const validBody = (schema: ZodType) => {
  return validate(schema, "body");
};

export const validParams = (schema: ZodType) => {
  return validate(schema, "params");
};

export const validQuery = (schema: ZodType) => {
  return validate(schema, "query");
};
