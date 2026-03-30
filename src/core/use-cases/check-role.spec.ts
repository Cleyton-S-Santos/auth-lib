import { describe, expect, it } from "vitest";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { checkRole } from "./check-role.use-case.js";

describe("checkRole", () => {
  it("aceita quando uma das roles coincide", () => {
    expect(() =>
      checkRole(["user", "admin"], "admin"),
    ).not.toThrow();
  });

  it("lança Forbidden quando roles insuficientes", () => {
    expect(() => checkRole(["user"], "admin")).toThrow(ForbiddenError);
  });

  it("lança Unauthorized quando não há roles", () => {
    expect(() => checkRole(undefined, "admin")).toThrow(UnauthorizedError);
  });
});
