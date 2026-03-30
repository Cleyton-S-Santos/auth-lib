import { MisconfigurationError } from "../core/errors/misconfiguration.error.js";
import type { CryptoProviderPort } from "../core/ports/crypto-provider.port.js";
import type { JwtProviderPort } from "../core/ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../core/ports/token-repository.port.js";
import type { UserRepositoryPort } from "../core/ports/user-repository.port.js";
import { logAuthLibError } from "./logger.js";

function assertMethods<T extends object>(
  portName: string,
  port: T,
  methods: (keyof T)[],
): void {
  for (const m of methods) {
    const fn = port[m];
    if (typeof fn !== "function") {
      const msg = `${portName}.${String(m)} is not implemented`;
      logAuthLibError(msg);
      throw new MisconfigurationError(msg);
    }
  }
}

export function validateUserRepositoryPort<T>(
  port: UserRepositoryPort<T>,
): void {
  assertMethods("UserRepositoryPort", port, [
    "findByIdentifier",
    "toAuthUser",
  ]);
}

export function validateTokenRepositoryPort(port: TokenRepositoryPort): void {
  assertMethods("TokenRepositoryPort", port, [
    "storeRefreshToken",
    "revokeRefreshToken",
    "blacklistAccessToken",
    "isAccessTokenBlacklisted",
  ]);
}

export function validateJwtProviderPort(port: JwtProviderPort): void {
  assertMethods("JwtProviderPort", port, [
    "signAccessToken",
    "signRefreshToken",
    "verify",
    "decode",
  ]);
}

export function validateCryptoProviderPort(port: CryptoProviderPort): void {
  assertMethods("CryptoProviderPort", port, ["hash", "compare"]);
}
