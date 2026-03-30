import { randomUUID } from "node:crypto";
import type { RefreshTokenClaims } from "../entities/token-payloads.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { ValidationError } from "../errors/validation.error.js";
import type { JwtProviderPort } from "../ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../ports/token-repository.port.js";
import type { UserRepositoryPort } from "../ports/user-repository.port.js";
import { assertMinimalAuthUser } from "../../utils/auth-user-validation.js";
import { expiresAtFromDuration, parseDurationToSeconds } from "../../utils/duration.js";
import type { AuthConfig } from "./auth-config.js";

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

function isRefreshClaims(
  p: Record<string, unknown>,
): p is RefreshTokenClaims & Record<string, unknown> {
  return (
    p.typ === "refresh" &&
    typeof p.sub === "string" &&
    typeof p.rtid === "string"
  );
}

export async function refreshToken<TUser>(
  deps: {
    config: AuthConfig;
    userRepository: UserRepositoryPort<TUser>;
    tokenRepository: TokenRepositoryPort;
    jwtProvider: JwtProviderPort;
  },
  input: RefreshTokenInput,
): Promise<RefreshTokenResult> {
  if (typeof input.refreshToken !== "string" || input.refreshToken === "") {
    throw new ValidationError("refreshToken é obrigatório", "refreshToken");
  }

  const payload = await deps.jwtProvider.verify(input.refreshToken);
  if (!isRefreshClaims(payload)) {
    throw new UnauthorizedError("Refresh token inválido");
  }

  if (deps.tokenRepository.isRefreshTokenRevoked) {
    const revoked = await deps.tokenRepository.isRefreshTokenRevoked(
      payload.rtid,
    );
    if (revoked) {
      throw new UnauthorizedError("Refresh token revogado");
    }
  }

  const raw = await deps.userRepository.findByIdentifier(payload.sub, "id");
  if (!raw) {
    throw new UnauthorizedError("Usuário não encontrado");
  }

  const user = deps.userRepository.toAuthUser(raw);
  assertMinimalAuthUser(user, "refreshToken");

  const sub = String(user.id);

  if (deps.config.refreshTokenRotation) {
    await deps.tokenRepository.revokeRefreshToken(payload.rtid);
    const newRtid = randomUUID();
    const jti = randomUUID();

    const accessToken = await deps.jwtProvider.signAccessToken(
      {
        sub,
        jti,
        typ: "access",
        roles: user.roles ?? [],
        permissions: user.permissions ?? [],
      },
      { expiresIn: deps.config.accessTokenExpiresIn },
    );

    const newRefresh = await deps.jwtProvider.signRefreshToken(
      {
        sub,
        rtid: newRtid,
        typ: "refresh",
      },
      { expiresIn: deps.config.refreshTokenExpiresIn },
    );

    const expiresAt = expiresAtFromDuration(deps.config.refreshTokenExpiresIn);
    await deps.tokenRepository.storeRefreshToken({
      userId: user.id,
      tokenId: newRtid,
      refreshToken: newRefresh,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: newRefresh,
      expiresInSeconds: parseDurationToSeconds(
        deps.config.accessTokenExpiresIn,
      ),
    };
  }

  const jti = randomUUID();
  const accessToken = await deps.jwtProvider.signAccessToken(
    {
      sub,
      jti,
      typ: "access",
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
    },
    { expiresIn: deps.config.accessTokenExpiresIn },
  );

  return {
    accessToken,
    refreshToken: input.refreshToken,
    expiresInSeconds: parseDurationToSeconds(
      deps.config.accessTokenExpiresIn,
    ),
  };
}
