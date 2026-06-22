import { describe, expect, it } from "vitest";
import { scaffoldStatus } from "./index";

describe("shared scaffold", () => {
  it("exposes the scaffold status", () => {
    expect(scaffoldStatus).toBe("initialized");
  });
});
