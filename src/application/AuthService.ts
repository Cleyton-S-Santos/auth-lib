import { UserRepository } from "../domain/ports/UserRepository";
import { PasswordHasher } from "../domain/ports/PasswordHasher";
import { CacheStore } from "../domain/ports/CacheStore";
import { TokenClaims, TokenManager } from "../domain/ports/TokenManager";
import { AuthError } from "../domain/errors";
import { LoginInput, RegisterInput, ValidationResult } from "./types";

export type AuthDeps<TUser> = {
  userRepo: UserRepository<TUser>;
  hasher: PasswordHasher;
  token: TokenManager;
  cache?: CacheStore;
  buildUser: (data: RegisterInput, hashedPassword: string) => TUser;
  getUserId: (user: TUser) => string;
  getPasswordHash: (user: TUser) => string;
  buildClaims?: (user: TUser) => Record<string, unknown>;
};

export class AuthService<TUser> {
  private deps: AuthDeps<TUser>;
  constructor(deps: AuthDeps<TUser>) {
    this.deps = deps;
  }

  async register(input: RegisterInput): Promise<TUser> {
    const existing = await this.deps.userRepo.findByEmail(input.email);
    if (existing) throw new AuthError("USER_EXISTS");
    const hashed = await this.deps.hasher.hash(input.password);
    const entity = this.deps.buildUser(input, hashed);
    const created = await this.deps.userRepo.create(entity);
    return created;
  }

  async login(input: LoginInput): Promise<{ user: TUser; token: string }> {
    const user = await this.deps.userRepo.findByEmail(input.email);
    if (!user) throw new AuthError("INVALID_CREDENTIALS");
    const ok = await this.deps.hasher.compare(input.password, this.deps.getPasswordHash(user));
    if (!ok) throw new AuthError("INVALID_CREDENTIALS");
    const claims: TokenClaims = {
      sub: this.deps.getUserId(user),
      ...(this.deps.buildClaims ? this.deps.buildClaims(user) : {}),
    };
    const token = await this.deps.token.issue(claims);
    return { user, token };
  }

  async validate(token: string): Promise<ValidationResult<TUser>> {
    try {
      const vt = await this.deps.token.verify(token);
      if (this.deps.cache) {
        const key = this.blacklistKey(vt.jti, token);
        const b = await this.deps.cache.get(key);
        if (b) throw new AuthError("TOKEN_BLACKLISTED");
      }
      const user = await this.deps.userRepo.findById(String(vt.claims.sub));
      return { valid: true, claims: vt.claims, user };
    } catch (e) {
      return { valid: false };
    }
  }

  async logout(token: string): Promise<void> {
    if (!this.deps.cache) return;
    const vt = await this.deps.token.verify(token);
    const key = this.blacklistKey(vt.jti, token);
    const ttl = this.computeTtlSeconds(vt.exp);
    await this.deps.cache.set(key, "1", ttl);
  }

  private blacklistKey(jti: string | undefined, token: string): string {
    return `auth:blacklist:${jti ?? token}`;
  }

  private computeTtlSeconds(exp?: number): number | undefined {
    if (!exp) return undefined;
    const ms = exp * 1000 - Date.now();
    const s = Math.floor(ms / 1000);
    return s > 0 ? s : 1;
  }
}
