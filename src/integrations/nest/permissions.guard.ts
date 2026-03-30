import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { AuthService } from "../../core/auth.service.js";
import { AUTH_SERVICE, PERMISSIONS_KEY } from "./constants.js";
import { throwHttpFromAuthError } from "./map-auth-error.js";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permissions?.length) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const userPerms = req.auth?.claims.permissions;
    try {
      this.auth.checkPermission(userPerms, permissions);
      return true;
    } catch (e) {
      throwHttpFromAuthError(e);
    }
  }
}
