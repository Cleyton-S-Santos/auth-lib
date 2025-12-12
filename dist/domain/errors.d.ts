export type AuthErrorCode = "USER_EXISTS" | "INVALID_CREDENTIALS" | "TOKEN_INVALID" | "TOKEN_BLACKLISTED";
export declare class AuthError extends Error {
    code: AuthErrorCode;
    constructor(code: AuthErrorCode, message?: string);
}
