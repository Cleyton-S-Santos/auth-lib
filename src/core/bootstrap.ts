import { MisconfigurationError } from "./errors/misconfiguration.error.js";
import type { CryptoProviderPort } from "./ports/crypto-provider.port.js";
import type { JwtProviderPort } from "./ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "./ports/token-repository.port.js";
import type { UserRepositoryPort } from "./ports/user-repository.port.js";
import type { AuthConfig } from "./use-cases/auth-config.js";
import { parseDurationToSeconds } from "../utils/duration.js";
import { logAuthLibError } from "../utils/logger.js";
import {
  validateCryptoProviderPort,
  validateJwtProviderPort,
  validateTokenRepositoryPort,
  validateUserRepositoryPort,
} from "../utils/port-validation.js";

export interface AuthPorts<TUser = unknown> {
  config: AuthConfig;
  userRepository: UserRepositoryPort<TUser>;
  tokenRepository: TokenRepositoryPort;
  jwtProvider: JwtProviderPort;
  cryptoProvider: CryptoProviderPort;
}

function validateAuthConfig(config: AuthConfig): void {
  if (!config.jwtSecret || typeof config.jwtSecret !== "string") {
    const msg = 'AuthConfig.jwtSecret must be a non-empty string';
    logAuthLibError(msg);
    throw new MisconfigurationError(msg);
  }
  for (const key of ["accessTokenExpiresIn", "refreshTokenExpiresIn"] as const) {
    const v = config[key];
    if (typeof v !== "string" || v.trim() === "") {
      const m = `AuthConfig.${key} must be a non-empty duration string (ex: 15m)`;
      logAuthLibError(m);
      throw new MisconfigurationError(m);
    }
    try {
      parseDurationToSeconds(v);
    } catch (e) {
      logAuthLibError(`AuthConfig.${key} has invalid duration format`);
      throw e;
    }
  }
}

export function validateAuthPorts<TUser>(ports: AuthPorts<TUser>): void {
  validateAuthConfig(ports.config);
  validateUserRepositoryPort(ports.userRepository);
  validateTokenRepositoryPort(ports.tokenRepository);
  validateJwtProviderPort(ports.jwtProvider);
  validateCryptoProviderPort(ports.cryptoProvider);
}
