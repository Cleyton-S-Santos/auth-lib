export function logAuthLibError(message: string): void {
  const c = globalThis.console;
  if (c?.error) {
    c.error(`[AuthLib Error] ${message}`);
  }
}
