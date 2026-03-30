export type {
  AccessTokenClaims,
  AuthUser,
  RefreshTokenClaims,
  TokenType,
} from "./core/entities/index.js";

export {
  AuthError,
  ForbiddenError,
  InvalidCredentialsError,
  MisconfigurationError,
  TokenExpiredError,
  UnauthorizedError,
  ValidationError,
} from "./core/errors/index.js";

export type {
  CacheProviderPort,
  CryptoProviderPort,
  JwtProviderPort,
  JwtVerifyOptions,
  StoreRefreshTokenInput,
  TokenRepositoryPort,
  UserRepositoryPort,
} from "./core/ports/index.js";

export type { AuthConfig } from "./core/use-cases/auth-config.js";
export type {
  LoginInput,
  LoginResult,
  LogoutInput,
  RefreshTokenInput,
  RefreshTokenResult,
  ValidatedAccessContext,
} from "./core/use-cases/index.js";
export {
  checkPermission,
  checkRole,
  login,
  logout,
  refreshToken,
  validateAccessToken,
} from "./core/use-cases/index.js";

export type { AuthPorts } from "./core/bootstrap.js";
export { validateAuthPorts } from "./core/bootstrap.js";

export { AuthService, createAuthService } from "./core/auth.service.js";

export {
  assertMinimalAuthUser,
  expiresAtFromDuration,
  parseDurationToSeconds,
  validateCryptoProviderPort,
  validateJwtProviderPort,
  validateTokenRepositoryPort,
  validateUserRepositoryPort,
} from "./utils/index.js";

export { getHttpStatusForAuthError } from "./integrations/http-error-map.js";
export { extractBearerTokenFromHeader } from "./integrations/bearer.js";

export { JoseJwtAdapter } from "./adapters/jwt/jose-jwt.adapter.js";
export { BcryptCryptoAdapter } from "./adapters/crypto/bcrypt-crypto.adapter.js";
