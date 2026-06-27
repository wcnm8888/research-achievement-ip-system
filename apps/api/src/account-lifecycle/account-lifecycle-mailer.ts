import { Injectable } from "@nestjs/common";
import { AccountLifecycleDeliveryStatus, AccountLifecycleTokenPurpose } from "@prisma/client";

export type AccountLifecycleMailTemplate =
  | "INVITE_ACCEPT"
  | "PASSWORD_RESET";

export type AccountLifecycleMailInput = {
  template: AccountLifecycleMailTemplate;
  purpose: AccountLifecycleTokenPurpose;
  targetUserId: string;
  emailHash: string | null;
  token: string;
};

export type AccountLifecycleMailResult = {
  deliveryStatus: AccountLifecycleDeliveryStatus;
  adapter: "LOCAL_SAFE_STUB";
  template: AccountLifecycleMailTemplate;
};

@Injectable()
export class AccountLifecycleMailer {
  async enqueue(input: AccountLifecycleMailInput): Promise<AccountLifecycleMailResult> {
    void input.token;
    return {
      deliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
      adapter: "LOCAL_SAFE_STUB",
      template: input.template,
    };
  }
}
