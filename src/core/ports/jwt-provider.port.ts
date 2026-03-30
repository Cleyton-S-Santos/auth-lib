export interface JwtVerifyOptions {
  ignoreExpiration?: boolean;
}

export interface JwtProviderPort {
  signAccessToken(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): Promise<string>;
  signRefreshToken(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): Promise<string>;
  verify(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<Record<string, unknown>>;
  decode(token: string): Record<string, unknown> | null;
}
