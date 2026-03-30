import {
  compactVerify,
  decodeJwt,
  jwtVerify,
  SignJWT,
  type JWTPayload,
  type JWTVerifyOptions,
} from "jose";
import { JWTExpired } from "jose/errors";
import { TokenExpiredError } from "../../core/errors/token-expired.error.js";
import { UnauthorizedError } from "../../core/errors/unauthorized.error.js";
import type {
  JwtProviderPort,
  JwtVerifyOptions,
} from "../../core/ports/jwt-provider.port.js";

export interface JoseJwtAdapterOptions {
  secret: string;
  issuer?: string;
  audience?: string;
}

function toKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function mapVerifyError(e: unknown): never {
  if (e instanceof JWTExpired) {
    throw new TokenExpiredError(undefined, e);
  }
  if (e && typeof e === "object" && "code" in e) {
    const code = (e as { code?: string }).code;
    if (code === "ERR_JWT_EXPIRED") {
      throw new TokenExpiredError(undefined, e);
    }
  }
  throw new UnauthorizedError("Falha na verificação do JWT", e);
}

function parsePayloadBytes(payload: Uint8Array): Record<string, unknown> {
  const json = new TextDecoder().decode(payload);
  return JSON.parse(json) as Record<string, unknown>;
}

export class JoseJwtAdapter implements JwtProviderPort {
  private readonly key: Uint8Array;

  constructor(private readonly opts: JoseJwtAdapterOptions) {
    this.key = toKey(opts.secret);
  }

  async signAccessToken(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): Promise<string> {
    let jwt = new SignJWT(payload as JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(options?.expiresIn ?? "15m");
    if (this.opts.issuer) jwt = jwt.setIssuer(this.opts.issuer);
    if (this.opts.audience) jwt = jwt.setAudience(this.opts.audience);
    return jwt.sign(this.key);
  }

  async signRefreshToken(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): Promise<string> {
    let jwt = new SignJWT(payload as JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(options?.expiresIn ?? "7d");
    if (this.opts.issuer) jwt = jwt.setIssuer(this.opts.issuer);
    if (this.opts.audience) jwt = jwt.setAudience(this.opts.audience);
    return jwt.sign(this.key);
  }

  async verify(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<Record<string, unknown>> {
    const verifyOpts: JWTVerifyOptions = {};
    if (this.opts.issuer) verifyOpts.issuer = this.opts.issuer;
    if (this.opts.audience) verifyOpts.audience = this.opts.audience;
    try {
      const { payload } = await jwtVerify(token, this.key, verifyOpts);
      return { ...payload } as Record<string, unknown>;
    } catch (e) {
      if (
        options?.ignoreExpiration &&
        e instanceof JWTExpired
      ) {
        try {
          const { payload } = await compactVerify(token, this.key);
          return parsePayloadBytes(payload);
        } catch (e2) {
          mapVerifyError(e2);
        }
      }
      mapVerifyError(e);
    }
  }

  decode(token: string): Record<string, unknown> | null {
    try {
      const p = decodeJwt(token);
      return { ...p } as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
