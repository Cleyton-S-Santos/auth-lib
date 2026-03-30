import { ForbiddenError } from "../errors/forbidden.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { ValidationError } from "../errors/validation.error.js";

export function checkPermission(
  userPermissions: string[] | undefined,
  required: string | string[],
): void {
  const need = Array.isArray(required) ? required : [required];
  if (need.length === 0) {
    throw new ValidationError(
      "É necessária ao menos uma permissão",
      "permissions",
    );
  }

  const have = new Set(userPermissions ?? []);
  const ok = need.some((p) => have.has(p));
  if (!ok) {
    if (!userPermissions?.length) {
      throw new UnauthorizedError("Usuário sem permissões");
    }
    throw new ForbiddenError("Permissão insuficiente");
  }
}
