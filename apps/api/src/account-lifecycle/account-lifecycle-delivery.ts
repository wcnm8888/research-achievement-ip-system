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
  failureCategory?: AccountLifecycleDeliveryFailureCategory;
};

export type AccountLifecycleNormalizedDeliveryResult = {
  deliveryStatus: AccountLifecycleDeliveryStatus;
  adapter: string;
  providerMessageId?: string;
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
  failureCategory: result.failureCategory,
});

const providerMessageIdMaxLength = 255;
const unsafeProviderMessageIdPattern =
  /(@|https?:\/\/|token=|cookie=|password=|secret=|key=|-----BEGIN|[\r\n])/i;
