import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../core/errors/unauthorized.error.js";
import type { AuthService } from "../../core/auth.service.js";
import { extractBearerToken } from "./bearer.js";

export function createAuthMiddleware(auth: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        throw new UnauthorizedError("Token Bearer ausente");
      }
      const ctx = await auth.validateAccessToken(token);
      (req as Request & { auth?: typeof ctx }).auth = ctx;
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function createRoleMiddleware(
  auth: AuthService,
  roles: string | string[],
) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    try {
      const req = _req as Request & {
        auth?: Awaited<ReturnType<AuthService["validateAccessToken"]>>;
      };
      const list = req.auth?.claims.roles;
      auth.checkRole(list, roles);
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function createPermissionMiddleware(
  auth: AuthService,
  permissions: string | string[],
) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    try {
      const req = _req as Request & {
        auth?: Awaited<ReturnType<AuthService["validateAccessToken"]>>;
      };
      const list = req.auth?.claims.permissions;
      auth.checkPermission(list, permissions);
      next();
    } catch (e) {
      next(e);
    }
  };
}
