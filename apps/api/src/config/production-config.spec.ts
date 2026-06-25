import { describe, expect, it, vi } from "vitest";
import {
  buildCorsOptions,
  getSessionCookieClearOptions,
  getSessionCookieOptions,
  isBootstrapEnabled,
  ProductionConfigError,
  productionOrigin,
  validateRuntimeConfig,
  warnIfBootstrapEnabled,
} from "./production-config";

const strongSecret = "production-local-test-session-secret-32-bytes-minimum";
const databaseUrl = "postgresql://local_user:local_password@127.0.0.1:55432/local_db";

describe("validateRuntimeConfig", () => {
  it("fails fast when production SESSION_SECRET is missing", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        DATABASE_URL: databaseUrl,
      }),
    ).toThrow(ProductionConfigError);
  });

  it("fails fast when production SESSION_SECRET is weak", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        DATABASE_URL: databaseUrl,
        SESSION_SECRET: "secret",
      }),
    ).toThrow(ProductionConfigError);
  });

  it("fails fast when production DATABASE_URL is missing", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        SESSION_SECRET: strongSecret,
      }),
    ).toThrow(ProductionConfigError);
  });

  it("uses same-origin production as the safe default without opening CORS", () => {
    const state = validateRuntimeConfig({
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: strongSecret,
    });

    expect(state.isProduction).toBe(true);
    expect(state.cors.enabled).toBe(false);
    expect(buildCorsOptions(state)).toBeNull();
  });

  it("allows only the production HTTPS origin when CORS is explicitly enabled", () => {
    const state = validateRuntimeConfig({
      NODE_ENV: "production",
      CORS_ALLOWED_ORIGIN: productionOrigin,
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: strongSecret,
    });

    expect(buildCorsOptions(state)).toEqual({
      origin: productionOrigin,
      credentials: true,
    });
  });

  it("does not allow wildcard CORS with credentials in production", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        CORS_ALLOWED_ORIGIN: "*",
        DATABASE_URL: databaseUrl,
        SESSION_SECRET: strongSecret,
      }),
    ).toThrow(ProductionConfigError);
  });

  it("does not force production-only validation in test and dev modes", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "test",
      }),
    ).not.toThrow();
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "development",
      }),
    ).not.toThrow();
  });

  it("exposes bootstrap enabled state without exposing secret values", () => {
    const state = validateRuntimeConfig({
      NODE_ENV: "production",
      AUTH_BOOTSTRAP_ENABLED: "true",
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: strongSecret,
    });

    expect(state.bootstrapEnabled).toBe(true);
    expect(JSON.stringify(state)).not.toContain(strongSecret);
    expect(isBootstrapEnabled({ AUTH_BOOTSTRAP_ENABLED: "true" })).toBe(true);
    expect(isBootstrapEnabled({ AUTH_BOOTSTRAP_ENABLED: "false" })).toBe(false);
  });

  it("emits a redacted production bootstrap warning", () => {
    const warn = vi.fn();
    const state = validateRuntimeConfig({
      NODE_ENV: "production",
      AUTH_BOOTSTRAP_ENABLED: "true",
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: strongSecret,
    });

    warnIfBootstrapEnabled(state, warn);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).not.toContain(strongSecret);
    expect(warn.mock.calls[0]?.[0]).not.toContain(databaseUrl);
  });
});

describe("session cookie config", () => {
  it("sets Secure and omits Domain by default in production", () => {
    const expires = new Date("2026-06-24T00:00:00.000Z");
    const options = getSessionCookieOptions(expires, { NODE_ENV: "production" });

    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires,
    });
    expect("domain" in options).toBe(false);
  });

  it("keeps local test cookies non-secure while preserving safe defaults", () => {
    expect(getSessionCookieClearOptions({ NODE_ENV: "test" })).toEqual({
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });
});
