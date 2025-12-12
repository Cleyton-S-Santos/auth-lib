export interface UserRepository<TUser> {
  findByEmail(email: string): Promise<TUser | null>;
  findById(id: string): Promise<TUser | null>;
  create(user: TUser): Promise<TUser>;
  update(user: TUser): Promise<TUser>;
}
