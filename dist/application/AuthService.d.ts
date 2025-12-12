import { UserRepository } from "../domain/ports/UserRepository";
import { PasswordHasher } from "../domain/ports/PasswordHasher";
import { CacheStore } from "../domain/ports/CacheStore";
import { TokenManager } from "../domain/ports/TokenManager";
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
export declare class AuthService<TUser> {
    private deps;
    constructor(deps: AuthDeps<TUser>);
    register(input: RegisterInput): Promise<TUser>;
    login(input: LoginInput): Promise<{
        user: TUser;
        token: string;
    }>;
    validate(token: string): Promise<ValidationResult<TUser>>;
    logout(token: string): Promise<void>;
    private blacklistKey;
    private computeTtlSeconds;
}
