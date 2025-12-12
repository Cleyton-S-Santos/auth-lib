export type AuthErrorCode =
  | "USER_EXISTS"
  | "INVALID_CREDENTIALS"
  | "TOKEN_INVALID"
  | "TOKEN_BLACKLISTED";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
