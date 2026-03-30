import { MisconfigurationError } from "../core/errors/misconfiguration.error.js";

const UNIT: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

export function parseDurationToSeconds(input: string): number {
  const s = input.trim();
  const m = /^(\d+)(s|m|h|d|w)$/i.exec(s);
  if (!m) {
    throw new MisconfigurationError(
      `[AuthLib] Duração inválida: "${input}". Use formato como 15m, 1h, 7d.`,
    );
  }
  const n = Number.parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  return n * (UNIT[u] ?? 0);
}

export function expiresAtFromDuration(duration: string): Date {
  const sec = parseDurationToSeconds(duration);
  return new Date(Date.now() + sec * 1000);
}
