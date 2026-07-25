import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AccountLifecycleAccess,
  acceptInviteFromForm,
  confirmPasswordResetFromForm,
  getSafeLifecycleErrorMessage,
  parsePublicLifecycleIntent,
  requestPasswordResetFromForm,
  resolveLifecycleTokenValue,
} from "./AccountLifecycleAccess";
import type { ApiError, AuthClient } from "./api-client";

describe("public account lifecycle helpers", () => {
  it("parses public lifecycle URL intents without exposing full links", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    expect(parsePublicLifecycleIntent("http://localhost/?flow=forgot-password")).toEqual({
      mode: "forgot-password",
    });
    expect(parsePublicLifecycleIntent("http://localhost/?flow=reset-password&token=test-token")).toEqual({
      mode: "reset-password",
      token: "test-token",
    });
    expect(parsePublicLifecycleIntent("http://localhost/?flow=invite-accept&token=invite-token")).toEqual({
      mode: "invite-accept",
      token: "invite-token",
    });
    expect(parsePublicLifecycleIntent("http://localhost/")).toEqual({ mode: "login" });
  });

  it("maps invalid and expired token failures to a single safe message", () => {
    const unauthorized: ApiError = {
      kind: "unauthorized",
      status: 401,
      message: "Invalid or expired token.",
    };
    const conflict: ApiError = {
      kind: "unknown",
      status: 409,
      message: "User is not eligible.",
    };

    expect(getSafeLifecycleErrorMessage(unauthorized)).toContain(
      "该链接无效或已过期，请从登录页或管理员处重新获取链接。",
    );
    expect(getSafeLifecycleErrorMessage(conflict)).toContain(
      "该链接无效或已过期，请从登录页或管理员处重新获取链接。",
    );
  });

  it("trims token/email inputs and delegates to auth client methods", async () => {
    const authClient = {
      requestPasswordReset: vi.fn(async () => ({ accepted: true as const })),
      confirmPasswordReset: vi.fn(async () => ({ reset: true as const })),
      acceptInvite: vi.fn(async () => ({ accepted: true as const })),
    };

    await requestPasswordResetFromForm(authClient, { email: " user@example.com " });
    await confirmPasswordResetFromForm(authClient, {
      token: " reset-token-value ",
      newPassword: "new-password-123",
    });
    await acceptInviteFromForm(authClient, {
      token: " invite-token-value ",
      password: "new-password-123",
    });

    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
      email: "user@example.com",
    });
    expect(authClient.confirmPasswordReset).toHaveBeenCalledWith({
      token: "reset-token-value",
      newPassword: "new-password-123",
    });
    expect(authClient.acceptInvite).toHaveBeenCalledWith({
      token: "invite-token-value",
      password: "new-password-123",
    });
  });

  it("keeps URL tokens out of form values while preserving submit fallback", () => {
    expect(resolveLifecycleTokenValue(undefined, " reset-token-from-url ")).toBe(
      "reset-token-from-url",
    );
    expect(resolveLifecycleTokenValue(" typed-token-value ", " reset-token-from-url ")).toBe(
      "typed-token-value",
    );
  });

  it("does not render a raw token or full link from reset and invite intents", () => {
    const authClient = makeAuthClient();
    const resetHtml = renderToStaticMarkup(
      <AccountLifecycleAccess
        authClient={authClient}
        intent={{ mode: "reset-password", token: "raw-reset-token-from-link" }}
        onBackToLogin={() => undefined}
      />,
    );
    const inviteHtml = renderToStaticMarkup(
      <AccountLifecycleAccess
        authClient={authClient}
        intent={{ mode: "invite-accept", token: "raw-invite-token-from-link" }}
        onBackToLogin={() => undefined}
      />,
    );

    expect(resetHtml).toContain("设置新密码");
    expect(inviteHtml).toContain("接受邀请");
    expect(resetHtml).not.toContain("raw-reset-token-from-link");
    expect(inviteHtml).not.toContain("raw-invite-token-from-link");
    expect(resetHtml).not.toContain("http://");
    expect(inviteHtml).not.toContain("http://");
  });
});

const makeAuthClient = (): AuthClient => ({
  me: vi.fn(async () => {
    throw new Error("not used");
  }),
  login: vi.fn(async () => {
    throw new Error("not used");
  }),
  logout: vi.fn(async () => undefined),
  requestPasswordReset: vi.fn(async () => ({ accepted: true as const })),
  confirmPasswordReset: vi.fn(async () => ({ reset: true as const })),
  acceptInvite: vi.fn(async () => ({ accepted: true as const })),
});
