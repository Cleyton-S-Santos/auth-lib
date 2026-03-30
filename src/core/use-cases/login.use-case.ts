import { randomUUID } from "node:crypto";
import type { AuthUser } from "../entities/auth-user.js";
import { InvalidCredentialsError } from "../errors/invalid-credentials.error.js";
import { ValidationError } from "../errors/validation.error.js";
import type { CryptoProviderPort } from "../ports/crypto-provider.port.js";
import type { JwtProviderPort } from "../ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../ports/token-repository.port.js";
import type { UserRepositoryPort } from "../ports/user-repository.port.js";
import { assertMinimalAuthUser } from "../../utils/auth-user-validation.js";
import { expiresAtFromDuration, parseDurationToSeconds } from "../../utils/duration.js";
import type { AuthConfig } from "./auth-config.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

function requireNonEmpty(value: string, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`Campo obrigatório: ${field}`, field);
  }
}

export async function login<TUser>(
  deps: {
    config: AuthConfig;
    userRepository: UserRepositoryPort<TUser>;
    tokenRepository: TokenRepositoryPort;
    jwtProvider: JwtProviderPort;
    cryptoProvider: CryptoProviderPort;
  },
  input: LoginInput,
): Promise<LoginResult> {
  requireNonEmpty(input.email, "email");
  requireNonEmpty(input.password, "password");

  const raw = await deps.userRepository.findByIdentifier(
    input.email.trim().toLowerCase(),
    "email",
  );
  if (!raw) {
    throw new InvalidCredentialsError();
  }

  const user: AuthUser = deps.userRepository.toAuthUser(raw);
  assertMinimalAuthUser(user, "login");

  if (!user.password) {
    throw new InvalidCredentialsError(
      "Usuário sem hash de senha configurado no contrato",
    );
  }

  const ok = await deps.cryptoProvider.compare(
    input.password,
    user.password,
  );
  if (!ok) {
    throw new InvalidCredentialsError();
  }

  const sub = String(user.id);
  const jti = randomUUID();
  const rtid = randomUUID();

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

  const refreshToken = await deps.jwtProvider.signRefreshToken(
    {
      sub,
      rtid,
      typ: "refresh",
    },
    { expiresIn: deps.config.refreshTokenExpiresIn },
  );

  const expiresAt = expiresAtFromDuration(deps.config.refreshTokenExpiresIn);
  await deps.tokenRepository.storeRefreshToken({
    userId: user.id,
    tokenId: rtid,
    refreshToken,
    expiresAt,
  });

  const expiresInSeconds = parseDurationToSeconds(
    deps.config.accessTokenExpiresIn,
  );

  return { accessToken, refreshToken, expiresInSeconds };
}
