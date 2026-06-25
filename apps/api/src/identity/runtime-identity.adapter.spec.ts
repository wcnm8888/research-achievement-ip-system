import { describe, expect, it, vi } from "vitest";
import { RuntimeIdentityAdapter } from "./runtime-identity.adapter";

describe("RuntimeIdentityAdapter", () => {
  it("uses the session adapter in production", async () => {
    const devIdentityAdapter = {
      loadUserContext: vi.fn(),
    };
    const sessionIdentityAdapter = {
      loadUserContext: vi.fn(async () => null),
    };
    const adapter = new RuntimeIdentityAdapter(
      devIdentityAdapter as never,
      sessionIdentityAdapter as never,
    );

    await expect(
      adapter.loadUserContext({
        headers: { "x-demo-user-id": "demo-user" },
        environment: "production",
      }),
    ).resolves.toBeNull();

    expect(sessionIdentityAdapter.loadUserContext).toHaveBeenCalledOnce();
    expect(devIdentityAdapter.loadUserContext).not.toHaveBeenCalled();
  });

  it("uses the dev identity adapter outside production", async () => {
    const devIdentityAdapter = {
      loadUserContext: vi.fn(async () => null),
    };
    const sessionIdentityAdapter = {
      loadUserContext: vi.fn(),
    };
    const adapter = new RuntimeIdentityAdapter(
      devIdentityAdapter as never,
      sessionIdentityAdapter as never,
    );

    await expect(
      adapter.loadUserContext({
        headers: { "x-demo-user-id": "demo-user" },
        environment: "test",
      }),
    ).resolves.toBeNull();

    expect(devIdentityAdapter.loadUserContext).toHaveBeenCalledOnce();
    expect(sessionIdentityAdapter.loadUserContext).not.toHaveBeenCalled();
  });
});
