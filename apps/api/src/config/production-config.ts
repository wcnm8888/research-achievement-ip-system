export const productionDomain = "production.wangyimin.cn";
export const productionOrigin = `https://${productionDomain}`;

const weakSessionSecretValues = new Set([
  "secret",
  "session_secret",
  "changeme",
  "change-me",
  "password",
  "development",
  "local",
  "test",
]);

type ConfigEnv = {
  AUTH_BOOTSTRAP_ENABLED?: string;
  CORS_ALLOWED_ORIGIN?: string;
  DATABASE_URL?: string;
  NODE_ENV?: string;
  PORT?: string;
  SESSION_SECRET?: string;
};

export type RuntimeConfigState = {
  isProduction: boolean;
  bootstrapEnabled: boolean;
  cors: {
    enabled: boolean;
    origin?: string;
    credentials: boolean;
  };
};

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  domain?: string;
  expires?: Date;
};

export type SessionCookieClearOptions = Pick<
  SessionCookieOptions,
  "domain" | "path" | "sameSite" | "secure"
>;

export class ProductionConfigError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid production configuration: ${issues.join(" ")}`);
    this.name = "ProductionConfigError";
  }
}

export const validateRuntimeConfig = (
  env: ConfigEnv = process.env,
): RuntimeConfigState => {
  const isProduction = isProductionEnv(env);
  const bootstrapEnabled = isBootstrapEnabled(env);
  const corsOrigin = normalizeOptionalEnv(env.CORS_ALLOWED_ORIGIN);

  if (!isProduction) {
    return {
      isProduction,
      bootstrapEnabled,
      cors: corsOrigin
        ? { enabled: true, origin: corsOrigin, credentials: true }
        : { enabled: false, credentials: true },
    };
  }

  const issues: string[] = [];
  const sessionSecret = normalizeOptionalEnv(env.SESSION_SECRET);
  if (!sessionSecret) {
    issues.push("SESSION_SECRET is required.");
  } else if (isWeakSessionSecret(sessionSecret)) {
    issues.push("SESSION_SECRET is too weak.");
  }

  if (!normalizeOptionalEnv(env.DATABASE_URL)) {
    issues.push("DATABASE_URL is required.");
  }

  if (corsOrigin) {
    validateProductionCorsOrigin(corsOrigin, issues);
  }

  if (issues.length > 0) {
    throw new ProductionConfigError(issues);
  }

  return {
    isProduction,
    bootstrapEnabled,
    cors: corsOrigin
      ? { enabled: true, origin: corsOrigin, credentials: true }
      : { enabled: false, credentials: true },
  };
};

export const buildCorsOptions = (
  state: RuntimeConfigState,
): { origin: string; credentials: true } | null => {
  if (!state.cors.enabled || !state.cors.origin) {
    return null;
  }

  return {
    origin: state.cors.origin,
    credentials: true,
  };
};

export const getSessionCookieOptions = (
  expires: Date,
  env: ConfigEnv = process.env,
): SessionCookieOptions => ({
  httpOnly: true,
  secure: isProductionEnv(env),
  sameSite: "lax",
  path: "/",
  expires,
});

export const getSessionCookieClearOptions = (
  env: ConfigEnv = process.env,
): SessionCookieClearOptions => ({
  secure: isProductionEnv(env),
  sameSite: "lax",
  path: "/",
});

export const isBootstrapEnabled = (env: ConfigEnv = process.env): boolean =>
  env.AUTH_BOOTSTRAP_ENABLED === "true";

export const warnIfBootstrapEnabled = (
  state: RuntimeConfigState,
  warn: (message: string) => void = console.warn,
): void => {
  if (!state.isProduction || !state.bootstrapEnabled) {
    return;
  }

  warn("AUTH_BOOTSTRAP_ENABLED is enabled in production; close it after first admin initialization.");
};

const isProductionEnv = (env: ConfigEnv): boolean => env.NODE_ENV === "production";

const normalizeOptionalEnv = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const isWeakSessionSecret = (sessionSecret: string): boolean => {
  const normalized = sessionSecret.trim().toLowerCase();
  if (sessionSecret.trim().length < 32) {
    return true;
  }

  if (weakSessionSecretValues.has(normalized)) {
    return true;
  }

  return new Set(normalized).size <= 4;
};

const validateProductionCorsOrigin = (origin: string, issues: string[]): void => {
  if (origin === "*" || origin.includes(",")) {
    issues.push("Wildcard or multi-origin CORS is not allowed in production.");
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    issues.push("CORS_ALLOWED_ORIGIN must be a valid HTTPS origin.");
    return;
  }

  if (parsed.origin !== origin || parsed.protocol !== "https:") {
    issues.push("CORS_ALLOWED_ORIGIN must be a valid HTTPS origin.");
    return;
  }

  if (parsed.origin !== productionOrigin) {
    issues.push("CORS_ALLOWED_ORIGIN must match the production web origin.");
  }
};
