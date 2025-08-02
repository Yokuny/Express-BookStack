import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { capitalize } from "../helpers/convert.helper";
import { CustomError } from "../models/error.type";

// biome-ignore lint: any
const extractErrorMessage = (err: any) => {
  const { path, received, message, expected } = err;

  const erroMessage = `Erro:'${message}'.${expected ? ` Esperado:'${capitalize(expected)}'` : ""}`;

  if (received === undefined) {
    return `O campo '${path}' é obrigatório. ${erroMessage}`;
  }

  return `O campo '${path}' recebeu '${received}'. ${erroMessage}`;
};

const validate = (schema: ZodType, type: "body" | "params" | "query") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req[type]);

      next();
      // biome-ignore lint: any
    } catch (e: any) {
      if (e.errors) {
        const errArray = e.errors;
        for (const err of errArray) {
          const errMessage = extractErrorMessage(err);

          next(new CustomError(errMessage, 400));
        }
      } else {
        next(new CustomError(e.message, 400));
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
