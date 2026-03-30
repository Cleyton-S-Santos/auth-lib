import { AuthError } from "./auth-error.js";

export class MisconfigurationError extends AuthError {
  readonly code = "MISCONFIGURATION";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
