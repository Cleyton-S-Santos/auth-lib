import { AuthError } from "./auth-error.js";

export class InvalidCredentialsError extends AuthError {
  readonly code = "INVALID_CREDENTIALS";

  constructor(message = "Credenciais inválidas", cause?: unknown) {
    super(message, cause);
  }
}
