import { AuthError } from "../core/errors/auth-error.js";
import { ForbiddenError } from "../core/errors/forbidden.error.js";
import { InvalidCredentialsError } from "../core/errors/invalid-credentials.error.js";
import { MisconfigurationError } from "../core/errors/misconfiguration.error.js";
import { TokenExpiredError } from "../core/errors/token-expired.error.js";
import { UnauthorizedError } from "../core/errors/unauthorized.error.js";
import { ValidationError } from "../core/errors/validation.error.js";

export function getHttpStatusForAuthError(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof InvalidCredentialsError) return 401;
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof TokenExpiredError) return 401;
  if (err instanceof ForbiddenError) return 403;
  if (err instanceof MisconfigurationError) return 500;
  if (err instanceof AuthError) return 500;
  return 500;
}
