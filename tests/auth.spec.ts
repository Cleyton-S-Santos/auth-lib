import { describe, it, expect } from "vitest";
import { AuthService } from "../src/application/AuthService";
import { UserRepository } from "../src/domain/ports/UserRepository";
import { PasswordHasher } from "../src/domain/ports/PasswordHasher";
import { TokenManager, VerifiedToken } from "../src/domain/ports/TokenManager";
import { CacheStore } from "../src/domain/ports/CacheStore";

type User = { id: string; email: string; passwordHash: string; name?: string };

class MemoryRepo implements UserRepository<User> {
  byId = new Map<string, User>();
  byEmail = new Map<string, User>();
  async findByEmail(email: string): Promise<User | null> {
    return this.byEmail.get(email) ?? null;
  }
  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }
  async create(user: User): Promise<User> {
    this.byId.set(user.id, user);
    this.byEmail.set(user.email, user);
    return user;
  }
  async update(user: User): Promise<User> {
    this.byId.set(user.id, user);
    this.byEmail.set(user.email, user);
    return user;
  }
}

class SimpleHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed:${plain}`;
  }
}

class MemoryCache implements CacheStore {
  map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

class FakeToken implements TokenManager {
  async issue(claims: { sub: string } & Record<string, unknown>, options?: { expiresInSeconds?: number }): Promise<string> {
    const jti = Math.random().toString(36).slice(2);
    const exp = Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? 300);
    const obj = { claims, jti, exp };
    return Buffer.from(JSON.stringify(obj)).toString("base64");
  }
  async verify(token: string): Promise<VerifiedToken> {
    const obj = JSON.parse(Buffer.from(token, "base64").toString());
    if (obj.exp <= Math.floor(Date.now() / 1000)) throw new Error("expired");
    return obj as VerifiedToken;
  }
}

const buildUser = (data: { email: string; password: string; attributes?: Record<string, unknown> }, hashed: string): User => {
  return {
    id: Math.random().toString(36).slice(2),
    email: data.email,
    passwordHash: hashed,
    name: String(data.attributes?.name ?? "") || undefined,
  };
};

const getUserId = (u: User) => u.id;
const getPasswordHash = (u: User) => u.passwordHash;

describe("AuthService", () => {
  it("registers and prevents duplicates", async () => {
    const service = new AuthService<User>({
      userRepo: new MemoryRepo(),
      hasher: new SimpleHasher(),
      token: new FakeToken(),
      cache: new MemoryCache(),
      buildUser,
      getUserId,
      getPasswordHash,
    });
    const u1 = await service.register({ email: "a@a.com", password: "p" });
    expect(u1.email).toBe("a@a.com");
    await expect(service.register({ email: "a@a.com", password: "p" })).rejects.toBeTruthy();
  });

  it("logs in and issues a token", async () => {
    const repo = new MemoryRepo();
    const hasher = new SimpleHasher();
    const token = new FakeToken();
    const cache = new MemoryCache();
    const service = new AuthService<User>({ userRepo: repo, hasher, token, cache, buildUser, getUserId, getPasswordHash });
    const u = await service.register({ email: "b@b.com", password: "secret" });
    const res = await service.login({ email: "b@b.com", password: "secret" });
    expect(res.user.id).toBe(u.id);
    expect(typeof res.token).toBe("string");
    await expect(service.login({ email: "b@b.com", password: "wrong" })).rejects.toBeTruthy();
  });

  it("validates and blacklists on logout", async () => {
    const repo = new MemoryRepo();
    const hasher = new SimpleHasher();
    const token = new FakeToken();
    const cache = new MemoryCache();
    const service = new AuthService<User>({ userRepo: repo, hasher, token, cache, buildUser, getUserId, getPasswordHash });
    const u = await service.register({ email: "c@c.com", password: "x" });
    const { token: t } = await service.login({ email: "c@c.com", password: "x" });
    const v1 = await service.validate(t);
    expect(v1.valid).toBe(true);
    expect(v1.user?.id).toBe(u.id);
    await service.logout(t);
    const v2 = await service.validate(t);
    expect(v2.valid).toBe(false);
  });

  it("rejects expired tokens", async () => {
    const repo = new MemoryRepo();
    const hasher = new SimpleHasher();
    const cache = new MemoryCache();
    const tm = new FakeToken();
    const service = new AuthService<User>({ userRepo: repo, hasher, token: tm, cache, buildUser, getUserId, getPasswordHash });
    await service.register({ email: "d@d.com", password: "y" });
    const t = await tm.issue({ sub: "abc" }, { expiresInSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    const v = await service.validate(t);
    expect(v.valid).toBe(false);
  });
});

