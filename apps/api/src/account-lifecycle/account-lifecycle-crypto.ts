import { createOpaqueToken, hashOpaqueToken, requireSessionSecret } from "../auth/auth-crypto";

export const createAccountLifecycleToken = (): string => createOpaqueToken();

export const hashAccountLifecycleToken = (token: string): string =>
  hashOpaqueToken(token, requireAccountLifecycleSecret());

export const hashAccountLifecycleEmail = (email: string): string =>
  hashOpaqueToken(email.trim().toLowerCase(), requireAccountLifecycleSecret());

const requireAccountLifecycleSecret = (): string =>
  process.env.ACCOUNT_LIFECYCLE_TOKEN_SECRET?.trim() || requireSessionSecret();
