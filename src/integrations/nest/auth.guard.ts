import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import type { AuthService } from "../../core/auth.service.js";
import { UnauthorizedError } from "../../core/errors/unauthorized.error.js";
import { extractBearerTokenFromHeader } from "../bearer.js";
import { AUTH_SERVICE } from "./constants.js";
import { throwHttpFromAuthError } from "./map-auth-error.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearerTokenFromHeader(req.headers.authorization);
    if (!token) {
      throwHttpFromAuthError(new UnauthorizedError("Token Bearer ausente"));
    }
    try {
      const ctx = await this.auth.validateAccessToken(token);
      req.auth = ctx;
      return true;
    } catch (e) {
      throwHttpFromAuthError(e);
    }
  }
}
