import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns a scaffold health status", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      service: "research-achievement-ip-api",
      status: "ok",
    });
  });
});
