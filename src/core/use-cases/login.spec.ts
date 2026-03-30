import { describe, expect, it, vi } from "vitest";
import { InvalidCredentialsError } from "../errors/invalid-credentials.error.js";
import { MisconfigurationError } from "../errors/misconfiguration.error.js";
import { ValidationError } from "../errors/validation.error.js";
import type { CryptoProviderPort } from "../ports/crypto-provider.port.js";
import type { JwtProviderPort } from "../ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../ports/token-repository.port.js";
import type { UserRepositoryPort } from "../ports/user-repository.port.js";
import { login } from "./login.use-case.js";

const config = {
  jwtSecret: "x",
  accessTokenExpiresIn: "15m",
  refreshTokenExpiresIn: "7d",
};

function makeDeps(overrides: {
  userRepository?: Partial<UserRepositoryPort<{ id: number; hash: string }>>;
  crypto?: Partial<CryptoProviderPort>;
  jwt?: Partial<JwtProviderPort>;
  tokens?: Partial<TokenRepositoryPort>;
} = {}) {
  const userRepository: UserRepositoryPort<{ id: number; hash: string }> = {
    findByIdentifier: vi.fn().mockResolvedValue({ id: 1, hash: "h" }),
    toAuthUser: vi.fn().mockImplementation((u: { id: number; hash: string }) => ({
      id: u.id,
      email: "a@b.com",
      password: u.hash,
      roles: ["user"],
      permissions: ["p:read"],
    })),
    ...overrides.userRepository,
  };
  const cryptoProvider: CryptoProviderPort = {
    hash: vi.fn(),
    compare: vi.fn().mockResolvedValue(true),
    ...overrides.crypto,
  };
  const jwtProvider: JwtProviderPort = {
    signAccessToken: vi.fn().mockResolvedValue("access"),
    signRefreshToken: vi.fn().mockResolvedValue("refresh"),
    verify: vi.fn(),
    decode: vi.fn(),
    ...overrides.jwt,
  };
  const tokenRepository: TokenRepositoryPort = {
    storeRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    blacklistAccessToken: vi.fn(),
    isAccessTokenBlacklisted: vi.fn().mockResolvedValue(false),
    ...overrides.tokens,
  };
  return {
    deps: {
      config,
      userRepository,
      tokenRepository,
      jwtProvider,
      cryptoProvider,
    },
    userRepository,
    cryptoProvider,
  };
}

describe("login", () => {
  it("faz login com credenciais válidas", async () => {
    const { deps } = makeDeps();
    const res = await login(deps, {
      email: "a@b.com",
      password: "secret",
    });
    expect(res.accessToken).toBe("access");
    expect(res.refreshToken).toBe("refresh");
    expect(deps.tokenRepository.storeRefreshToken).toHaveBeenCalled();
  });

  it("rejeita e-mail vazio", async () => {
    const { deps } = makeDeps();
    await expect(
      login(deps, { email: "", password: "x" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejeita usuário inexistente", async () => {
    const { deps } = makeDeps({
      userRepository: {
        findByIdentifier: vi.fn().mockResolvedValue(null),
      },
    });
    await expect(
      login(deps, { email: "x@y.com", password: "secret" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejeita senha incorreta", async () => {
    const { deps } = makeDeps({
      crypto: {
        compare: vi.fn().mockResolvedValue(false),
      },
    });
    await expect(
      login(deps, { email: "a@b.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("falha se AuthUser não tiver id", async () => {
    const { deps } = makeDeps({
      userRepository: {
        toAuthUser: vi.fn().mockReturnValue({
          id: "",
          password: "hash",
        }),
      },
    });
    await expect(
      login(deps, { email: "a@b.com", password: "secret" }),
    ).rejects.toBeInstanceOf(MisconfigurationError);
  });
});
