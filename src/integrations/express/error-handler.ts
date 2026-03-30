import type { NextFunction, Request, Response } from "express";
import { getHttpStatusForAuthError } from "../http-error-map.js";

export function createAuthErrorHandler() {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = getHttpStatusForAuthError(err);
    const message =
      err instanceof Error ? err.message : "Erro interno de autenticação";
    res.status(status).json({
      error: err instanceof Error ? err.name : "Error",
      message,
    });
  };
}
