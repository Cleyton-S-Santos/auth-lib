import { describe, expect, it, vi } from "vitest";
import { TokenExpiredError } from "../errors/token-expired.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import type { JwtProviderPort } from "../ports/jwt-provider.port.js";
import type { TokenRepositoryPort } from "../ports/token-repository.port.js";
import { validateAccessToken } from "./validate-access-token.use-case.js";

describe("validateAccessToken", () => {
  it("retorna contexto quando token é válido", async () => {
    const jwtProvider: JwtProviderPort = {
      signAccessToken: vi.fn(),
      signRefreshToken: vi.fn(),
      verify: vi.fn().mockResolvedValue({
        sub: "1",
        jti: "jti-1",
        typ: "access",
        roles: ["admin"],
        permissions: [],
      }),
      decode: vi.fn(),
    };
    const tokenRepository: TokenRepositoryPort = {
      storeRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      blacklistAccessToken: vi.fn(),
      isAccessTokenBlacklisted: vi.fn().mockResolvedValue(false),
    };
    const ctx = await validateAccessToken(
      { jwtProvider, tokenRepository },
      "tok",
    );
    expect(ctx.claims.sub).toBe("1");
    expect(ctx.claims.jti).toBe("jti-1");
  });

  it("rejeita token na blacklist", async () => {
    const jwtProvider: JwtProviderPort = {
      signAccessToken: vi.fn(),
      signRefreshToken: vi.fn(),
      verify: vi.fn().mockResolvedValue({
        sub: "1",
        jti: "jti-1",
        typ: "access",
      }),
      decode: vi.fn(),
    };
    const tokenRepository: TokenRepositoryPort = {
      storeRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      blacklistAccessToken: vi.fn(),
      isAccessTokenBlacklisted: vi.fn().mockResolvedValue(true),
    };
    await expect(
      validateAccessToken({ jwtProvider, tokenRepository }, "tok"),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("propaga TokenExpiredError", async () => {
    const jwtProvider: JwtProviderPort = {
      signAccessToken: vi.fn(),
      signRefreshToken: vi.fn(),
      verify: vi.fn().mockRejectedValue(new TokenExpiredError()),
      decode: vi.fn(),
    };
    const tokenRepository: TokenRepositoryPort = {
      storeRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      blacklistAccessToken: vi.fn(),
      isAccessTokenBlacklisted: vi.fn(),
    };
    await expect(
      validateAccessToken({ jwtProvider, tokenRepository }, "tok"),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });
});
