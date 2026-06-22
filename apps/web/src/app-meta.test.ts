import { describe, expect, it } from "vitest";
import { appName } from "./app-meta";

describe("app metadata", () => {
  it("keeps the product name available to the shell", () => {
    expect(appName).toBe("科研成果与知识产权管理系统");
  });
});
