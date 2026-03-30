import type { AuthPorts } from "./bootstrap.js";
import { validateAuthPorts as runValidation } from "./bootstrap.js";
import { checkPermission } from "./use-cases/check-permission.use-case.js";
import { checkRole } from "./use-cases/check-role.use-case.js";
import { login } from "./use-cases/login.use-case.js";
import { logout } from "./use-cases/logout.use-case.js";
import { refreshToken } from "./use-cases/refresh-token.use-case.js";
import { validateAccessToken } from "./use-cases/validate-access-token.use-case.js";
import type { LoginInput, LoginResult } from "./use-cases/login.use-case.js";
import type { LogoutInput } from "./use-cases/logout.use-case.js";
import type {
  RefreshTokenInput,
  RefreshTokenResult,
} from "./use-cases/refresh-token.use-case.js";
import type { ValidatedAccessContext } from "./use-cases/validate-access-token.use-case.js";

export class AuthService<TUser = unknown> {
  constructor(private readonly ports: AuthPorts<TUser>) {
    runValidation(ports);
  }

  login(input: LoginInput): Promise<LoginResult> {
    return login(this.ports, input);
  }

  refreshToken(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    return refreshToken(this.ports, input);
  }

  logout(input: LogoutInput): Promise<void> {
    return logout(this.ports, input);
  }

  validateAccessToken(token: string): Promise<ValidatedAccessContext> {
    return validateAccessToken(
      {
        jwtProvider: this.ports.jwtProvider,
        tokenRepository: this.ports.tokenRepository,
      },
      token,
    );
  }

  checkRole(userRoles: string[] | undefined, required: string | string[]): void {
    checkRole(userRoles, required);
  }

  checkPermission(
    userPermissions: string[] | undefined,
    required: string | string[],
  ): void {
    checkPermission(userPermissions, required);
  }
}

export function createAuthService<TUser>(ports: AuthPorts<TUser>): AuthService<TUser> {
  return new AuthService(ports);
}
