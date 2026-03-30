import { AuthError } from "./auth-error.js";

export class UnauthorizedError extends AuthError {
  readonly code = "UNAUTHORIZED";

  constructor(message = "Não autorizado", cause?: unknown) {
    super(message, cause);
  }
}
