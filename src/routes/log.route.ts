import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { respObj } from "../helpers/responsePattern.helper";
import { validToken } from "../middlewares";
import * as service from "../service/log.service";

const logRoute = Router();

logRoute.use(validToken);

logRoute.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await service.getSummary();
    res.json(respObj({ data: summary, message: "Resumo de observabilidade obtido com sucesso" }));
  } catch (error) {
    next(error);
  }
});

logRoute.get("/errors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = await service.getError500Rate();
    res.json(respObj({ data: errors, message: "Taxa de erro 500 obtida com sucesso" }));
  } catch (error) {
    next(error);
  }
});

logRoute.get("/heatmap", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const heatmap = await service.getHeatMap();
    res.json(respObj({ data: heatmap, message: "Heat map obtido com sucesso" }));
  } catch (error) {
    next(error);
  }
});

export { logRoute };
