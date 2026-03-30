import type { Request } from "express";
import { extractBearerTokenFromHeader } from "../bearer.js";

export function extractBearerToken(req: Request): string | undefined {
  return extractBearerTokenFromHeader(req.headers.authorization);
}
