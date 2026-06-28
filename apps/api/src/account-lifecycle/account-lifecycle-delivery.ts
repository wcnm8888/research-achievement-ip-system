import { AccountLifecycleDeliveryStatus, AccountLifecycleTokenPurpose } from "@prisma/client";

export type AccountLifecycleDeliveryTemplate = "INVITE_ACCEPT" | "PASSWORD_RESET";

export type AccountLifecycleProviderStatus =
  | "ACCEPTED"
  | "FAILED"
  | "RATE_LIMITED"
  | "SUPPRESSED"
  | "TEMPORARY_FAILURE";

export type AccountLifecycleDeliveryFailureCategory =
  | "CONFIGURATION"
  | "PERMANENT"
  | "RATE_LIMITED"
  | "SUPPRESSED"
  | "TEMPORARY";

export type AccountLifecycleDeliveryInput = {
  deliveryId: string;
  tokenId: string;
  purpose: AccountLifecycleTokenPurpose;
  template: AccountLifecycleDeliveryTemplate;
  targetUserId: string;
  emailHash: string | null;
  recipientEmail: string;
  expiresAt: Date;
  rawToken: string;
  publicBaseUrl: string;
  correlationId: string;
};

export type AccountLifecycleProviderResult = {
  status: AccountLifecycleProviderStatus;
  adapter: string;
  providerMessageId?: string;
  providerErrorCode?: string;
  failureCategory?: AccountLifecycleDeliveryFailureCategory;
};

export type AccountLifecycleNormalizedDeliveryResult = {
  deliveryStatus: AccountLifecycleDeliveryStatus;
  adapter: string;
  providerMessageId?: string;
  providerErrorCode?: string;
  failureCategory?: AccountLifecycleDeliveryFailureCategory;
};

export type AccountLifecycleSafeDeliveryProjection = AccountLifecycleNormalizedDeliveryResult & {
  tokenId: string;
  targetUserId: string;
  emailHash: string | null;
  correlationId: string;
};

export interface AccountLifecycleDeliveryAdapter {
  send(input: AccountLifecycleDeliveryInput): Promise<AccountLifecycleProviderResult>;
}

export const normalizeAccountLifecycleProviderResult = (
  result: AccountLifecycleProviderResult,
): AccountLifecycleNormalizedDeliveryResult => ({
  deliveryStatus: mapProviderStatusToDeliveryStatus(result.status),
  adapter: result.adapter,
  providerMessageId: normalizeProviderMessageId(result.providerMessageId),
  providerErrorCode: normalizeProviderErrorCode(result.providerErrorCode),
  failureCategory: result.failureCategory,
});

export const mapProviderStatusToDeliveryStatus = (
  status: AccountLifecycleProviderStatus,
): AccountLifecycleDeliveryStatus => {
  switch (status) {
    case "ACCEPTED":
      return AccountLifecycleDeliveryStatus.SENT;
    case "RATE_LIMITED":
    case "TEMPORARY_FAILURE":
      return AccountLifecycleDeliveryStatus.QUEUED;
    case "SUPPRESSED":
      return AccountLifecycleDeliveryStatus.SUPPRESSED;
    case "FAILED":
      return AccountLifecycleDeliveryStatus.FAILED;
  }
};

export const normalizeProviderMessageId = (providerMessageId: string | undefined): string | undefined => {
  if (!providerMessageId) {
    return undefined;
  }
  const trimmed = providerMessageId.trim();
  if (!trimmed || unsafeProviderMessageIdPattern.test(trimmed)) {
    return undefined;
  }
  return trimmed.slice(0, providerMessageIdMaxLength);
};

export const normalizeProviderErrorCode = (providerErrorCode: string | undefined): string | undefined => {
  if (!providerErrorCode) {
    return undefined;
  }
  const trimmed = providerErrorCode.trim();
  if (!trimmed || unsafeProviderDiagnosticPattern.test(trimmed) || !safeProviderDiagnosticPattern.test(trimmed)) {
    return undefined;
  }
  return trimmed.slice(0, providerErrorCodeMaxLength);
};

export const createAccountLifecycleSafeDeliveryProjection = (
  input: AccountLifecycleDeliveryInput,
  result: AccountLifecycleNormalizedDeliveryResult,
): AccountLifecycleSafeDeliveryProjection => ({
  tokenId: input.tokenId,
  targetUserId: input.targetUserId,
  emailHash: input.emailHash,
  correlationId: input.correlationId,
  deliveryStatus: result.deliveryStatus,
  adapter: result.adapter,
  providerMessageId: result.providerMessageId,
  providerErrorCode: result.providerErrorCode,
  failureCategory: result.failureCategory,
});

const providerMessageIdMaxLength = 255;
const providerErrorCodeMaxLength = 128;
const unsafeProviderMessageIdPattern =
  /(@|https?:\/\/|token=|cookie=|password=|secret=|key=|-----BEGIN|[\r\n])/i;
const unsafeProviderDiagnosticPattern =
  /(@|https?:\/\/|token=|cookie=|password=|secret=|key=|-----BEGIN|[\r\n])/i;
const safeProviderDiagnosticPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
