export interface AuthConfig {
  jwtSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  refreshTokenRotation?: boolean;
  issuer?: string;
  audience?: string;
}
