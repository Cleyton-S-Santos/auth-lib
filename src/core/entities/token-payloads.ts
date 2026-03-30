export type TokenType = "access" | "refresh";

export interface AccessTokenClaims {
  sub: string;
  jti: string;
  typ: "access";
  roles?: string[];
  permissions?: string[];
}

export interface RefreshTokenClaims {
  sub: string;
  rtid: string;
  typ: "refresh";
}
