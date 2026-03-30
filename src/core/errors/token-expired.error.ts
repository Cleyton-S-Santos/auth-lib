import { AuthError } from "./auth-error.js";

export class TokenExpiredError extends AuthError {
  readonly code = "TOKEN_EXPIRED";

  constructor(message = "Token expirado", cause?: unknown) {
    super(message, cause);
  }
}
