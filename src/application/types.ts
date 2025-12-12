import { TokenClaims } from "../domain/ports/TokenManager";

export type RegisterInput = {
  email: string;
  password: string;
  attributes?: Record<string, unknown>;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ValidationResult<TUser> = {
  valid: boolean;
  claims?: TokenClaims;
  user?: TUser | null;
};
