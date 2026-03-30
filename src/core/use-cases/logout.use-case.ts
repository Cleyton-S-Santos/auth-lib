import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { ValidationError } from "../errors/validation.error.js";
import type { JwtProviderPort } from "../ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../ports/token-repository.port.js";
import { parseDurationToSeconds } from "../../utils/duration.js";
import type { AuthConfig } from "./auth-config.js";

export interface LogoutInput {
  accessToken: string;
  refreshToken?: string;
}

export async function logout(
  deps: {
    config: AuthConfig;
    tokenRepository: TokenRepositoryPort;
    jwtProvider: JwtProviderPort;
  },
  input: LogoutInput,
): Promise<void> {
  if (typeof input.accessToken !== "string" || input.accessToken === "") {
    throw new ValidationError("accessToken é obrigatório", "accessToken");
  }

  let accessPayload: Record<string, unknown>;
  try {
    accessPayload = await deps.jwtProvider.verify(input.accessToken, {
      ignoreExpiration: true,
    });
  } catch {
    throw new UnauthorizedError("Access token inválido para logout");
  }

  if (typeof accessPayload.jti !== "string") {
    throw new UnauthorizedError("Access token sem jti para logout");
  }

  const ttl = parseDurationToSeconds(deps.config.accessTokenExpiresIn);
  await deps.tokenRepository.blacklistAccessToken(accessPayload.jti, ttl);

  if (input.refreshToken) {
    try {
      const p = await deps.jwtProvider.verify(input.refreshToken);
      if (
        p.typ === "refresh" &&
        typeof p.rtid === "string"
      ) {
        await deps.tokenRepository.revokeRefreshToken(p.rtid);
      }
    } catch {}
  }
}
