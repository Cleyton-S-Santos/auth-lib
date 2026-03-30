export abstract class AuthError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
