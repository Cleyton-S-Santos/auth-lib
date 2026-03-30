import { AuthError } from "./auth-error.js";

export class ForbiddenError extends AuthError {
  readonly code = "FORBIDDEN";

  constructor(message = "Acesso negado", cause?: unknown) {
    super(message, cause);
  }
}
