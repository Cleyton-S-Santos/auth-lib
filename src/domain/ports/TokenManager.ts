export type TokenClaims = { sub: string } & Record<string, unknown>;

export interface VerifiedToken {
  claims: TokenClaims;
  jti?: string;
  exp?: number;
}

export interface TokenManager {
  issue(claims: TokenClaims, options?: { expiresInSeconds?: number }): Promise<string>;
  verify(token: string): Promise<VerifiedToken>;
}
