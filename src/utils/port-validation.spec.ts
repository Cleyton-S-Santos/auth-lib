import { describe, expect, it, vi } from "vitest";
import { MisconfigurationError } from "../core/errors/misconfiguration.error.js";
import { validateUserRepositoryPort } from "./port-validation.js";

describe("validateUserRepositoryPort", () => {
  it("lança MisconfigurationError com log quando método falta", () => {
    const bad = {
      findByIdentifier: async () => null,
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      validateUserRepositoryPort(bad as never),
    ).toThrow(MisconfigurationError);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
