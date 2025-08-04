import type { NextFunction, Request, Response } from "express";
import { Log } from "../models/log.model";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", async () => {
    try {
      const responseTime = Date.now() - startTime;
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      const userID = (req as any).user?._id?.toString();

      const feature = getFeature(req.path);
      const error = res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined;

      await Log.create({
        method: req.method,
        route: req.path,
        statusCode: res.statusCode,
        responseTime,
        ip,
        userID,
        feature,
        error,
      });

      if (res.statusCode >= 500) {
        console.error(`🚨 ERRO 500: ${req.method} ${req.path} - ${responseTime}ms`);
      }
    } catch (err) {
      console.error("Erro ao salvar log:", err);
    }
  });

  next();
};

function getFeature(path: string): string {
  if (path.includes("/books")) return "books";
  if (path.includes("/auth")) return "auth";
  if (path.includes("/user")) return "users";
  return "system";
}
