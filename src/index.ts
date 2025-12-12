export { AuthService } from "./application/AuthService.js";
export type { RegisterInput, LoginInput, ValidationResult } from "./application/types.js";
export type { UserRepository } from "./domain/ports/UserRepository";
export type { PasswordHasher } from "./domain/ports/PasswordHasher";
export type { TokenManager, VerifiedToken, TokenClaims } from "./domain/ports/TokenManager";
export type { CacheStore } from "./domain/ports/CacheStore";
export { AuthError } from "./domain/errors.js";
export type { AuthErrorCode } from "./domain/errors.js";
