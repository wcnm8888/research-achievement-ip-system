import { Injectable } from "@nestjs/common";
import { AccountLifecycleDeliveryStatus, AccountLifecycleTokenPurpose } from "@prisma/client";
import {
  AccountLifecycleDeliveryAdapter,
  normalizeAccountLifecycleProviderResult,
} from "./account-lifecycle-delivery";

export type AccountLifecycleMailTemplate =
  | "INVITE_ACCEPT"
  | "PASSWORD_RESET";

export type AccountLifecycleMailInput = {
  tokenId: string;
  template: AccountLifecycleMailTemplate;
  purpose: AccountLifecycleTokenPurpose;
  targetUserId: string;
  emailHash: string | null;
  recipientEmail: string;
  expiresAt: Date;
  token: string;
};

export type AccountLifecycleMailResult = {
  deliveryStatus: AccountLifecycleDeliveryStatus;
  adapter: string;
  template: AccountLifecycleMailTemplate;
};

@Injectable()
export class AccountLifecycleMailer {
  constructor(private readonly adapter: AccountLifecycleDeliveryAdapter = new LocalSafeStubDeliveryAdapter()) {}

  async enqueue(input: AccountLifecycleMailInput): Promise<AccountLifecycleMailResult> {
    const result = normalizeAccountLifecycleProviderResult(
      await this.adapter.send({
        deliveryId: input.tokenId,
        tokenId: input.tokenId,
        purpose: input.purpose,
        template: input.template,
        targetUserId: input.targetUserId,
        emailHash: input.emailHash,
        recipientEmail: input.recipientEmail,
        expiresAt: input.expiresAt,
        rawToken: input.token,
        publicBaseUrl: localSafeStubPublicBaseUrl,
        correlationId: input.tokenId,
      }),
    );

    return {
      deliveryStatus: result.deliveryStatus,
      adapter: result.adapter,
      template: input.template,
    };
  }
}

export class LocalSafeStubDeliveryAdapter implements AccountLifecycleDeliveryAdapter {
  async send(): Promise<{
    status: "TEMPORARY_FAILURE";
    adapter: "LOCAL_SAFE_STUB";
    failureCategory: "SUPPRESSED";
  }> {
    return {
      status: "TEMPORARY_FAILURE",
      adapter: "LOCAL_SAFE_STUB",
      failureCategory: "SUPPRESSED",
    };
  }
}

const localSafeStubPublicBaseUrl = "https://local.invalid/";
