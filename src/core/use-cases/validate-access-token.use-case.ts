import type { AccessTokenClaims } from "../entities/token-payloads.js";
import { TokenExpiredError } from "../errors/token-expired.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { ValidationError } from "../errors/validation.error.js";
import type { JwtProviderPort } from "../ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../ports/token-repository.port.js";

export interface ValidatedAccessContext {
  claims: AccessTokenClaims;
  rawPayload: Record<string, unknown>;
}

function isAccessClaims(
  p: Record<string, unknown>,
): p is AccessTokenClaims & Record<string, unknown> {
  return (
    p.typ === "access" &&
    typeof p.sub === "string" &&
    typeof p.jti === "string"
  );
}

export async function validateAccessToken(
  deps: {
    jwtProvider: JwtProviderPort;
    tokenRepository: TokenRepositoryPort;
  },
  accessToken: string,
): Promise<ValidatedAccessContext> {
  if (typeof accessToken !== "string" || accessToken === "") {
    throw new ValidationError("accessToken é obrigatório", "accessToken");
  }

  let payload: Record<string, unknown>;
  try {
    payload = await deps.jwtProvider.verify(accessToken);
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      throw e;
    }
    throw new UnauthorizedError("Token inválido", e);
  }

  if (!isAccessClaims(payload)) {
    throw new UnauthorizedError("Token não é um access token válido");
  }

  const blacklisted = await deps.tokenRepository.isAccessTokenBlacklisted(
    payload.jti,
  );
  if (blacklisted) {
    throw new UnauthorizedError("Token revogado");
  }

  return {
    claims: {
      sub: payload.sub,
      jti: payload.jti,
      typ: "access",
      roles: Array.isArray(payload.roles)
        ? (payload.roles as string[])
        : undefined,
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : undefined,
    },
    rawPayload: payload,
  };
}
