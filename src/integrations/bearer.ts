export function extractBearerTokenFromHeader(
  authorization: string | undefined,
): string | undefined {
  if (!authorization || typeof authorization !== "string") return undefined;
  const [type, token] = authorization.split(/\s+/);
  if (!type || !token) return undefined;
  if (type.toLowerCase() !== "bearer") return undefined;
  return token;
}
