import type { ValidatedAccessContext } from "../core/use-cases/validate-access-token.use-case.js";

declare global {
  namespace Express {
    interface Request {
      auth?: ValidatedAccessContext;
    }
  }
}

export {};
