import type { AuthUser } from "../core/entities/auth-user.js";
import { MisconfigurationError } from "../core/errors/misconfiguration.error.js";
import { logAuthLibError } from "./logger.js";

export function assertMinimalAuthUser(user: AuthUser, context: string): void {
  if (user.id === undefined || user.id === null || user.id === "") {
    const msg = `User object must contain "id" (${context})`;
    logAuthLibError(msg);
    throw new MisconfigurationError(msg);
  }
}
