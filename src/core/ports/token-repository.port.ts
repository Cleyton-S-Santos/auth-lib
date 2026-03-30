export interface StoreRefreshTokenInput {
  userId: string | number;
  tokenId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface TokenRepositoryPort {
  storeRefreshToken(input: StoreRefreshTokenInput): Promise<void>;
  revokeRefreshToken(tokenId: string): Promise<void>;
  isRefreshTokenRevoked?(tokenId: string): Promise<boolean>;
  blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void>;
  isAccessTokenBlacklisted(jti: string): Promise<boolean>;
}
