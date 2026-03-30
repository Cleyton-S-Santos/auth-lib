import type { AuthUser } from "../entities/auth-user.js";

export interface UserRepositoryPort<TUser = unknown> {
  findByIdentifier(
    identifier: string,
    kind?: "email" | "id",
  ): Promise<TUser | null>;
  toAuthUser(user: TUser): AuthUser;
}
