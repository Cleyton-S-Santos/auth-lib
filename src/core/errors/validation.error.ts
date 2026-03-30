import { AuthError } from "./auth-error.js";

export class ValidationError extends AuthError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    readonly field?: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
