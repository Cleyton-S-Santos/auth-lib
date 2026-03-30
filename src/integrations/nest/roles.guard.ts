import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthService } from "../../core/auth.service.js";
import { AUTH_SERVICE, ROLES_KEY } from "./constants.js";
import { throwHttpFromAuthError } from "./map-auth-error.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const userRoles = req.auth?.claims.roles;
    try {
      this.auth.checkRole(userRoles, roles);
      return true;
    } catch (e) {
      throwHttpFromAuthError(e);
    }
  }
}
