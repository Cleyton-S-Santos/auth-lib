import { ForbiddenError } from "../errors/forbidden.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { ValidationError } from "../errors/validation.error.js";

export function checkRole(
  userRoles: string[] | undefined,
  required: string | string[],
): void {
  const need = Array.isArray(required) ? required : [required];
  if (need.length === 0) {
    throw new ValidationError("É necessário ao menos uma role", "roles");
  }

  const have = new Set(userRoles ?? []);
  const ok = need.some((r) => have.has(r));
  if (!ok) {
    if (!userRoles?.length) {
      throw new UnauthorizedError("Usuário sem roles");
    }
    throw new ForbiddenError("Role insuficiente");
  }
}
