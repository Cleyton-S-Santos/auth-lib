export class AuthError extends Error {
    constructor(code, message) {
        super(message ?? code);
        this.code = code;
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}
