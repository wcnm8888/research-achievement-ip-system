import { AccountLifecycleDeliveryStatus, AccountLifecycleTokenPurpose } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  AccountLifecycleDeliveryAdapter,
  AccountLifecycleProviderResult,
} from "./account-lifecycle-delivery";
import { aliyunDirectMailAdapterName, aliyunDirectMailDryRunAdapterName } from "./account-lifecycle-aliyun-directmail.adapter";
import { AccountLifecycleMailer } from "./account-lifecycle-mailer";
import { createAccountLifecycleDeliveryAdapterFromEnv } from "./account-lifecycle.module";

describe("account lifecycle delivery runtime wiring", () => {
  it("defaults to the local safe stub with no provider env", async () => {
    const createAliyunAdapter = vi.fn(() => makeAcceptedAdapter());
    const adapter = createAccountLifecycleDeliveryAdapterFromEnv({}, createAliyunAdapter);
    const mailer = new AccountLifecycleMailer(adapter);

    await expect(mailer.enqueue(makeMailInput())).resolves.toEqual({
      deliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
      adapter: "LOCAL_SAFE_STUB",
      template: "PASSWORD_RESET",
    });
    expect(createAliyunAdapter).not.toHaveBeenCalled();
  });

  it("fails safe to the local safe stub for unknown providers", async () => {
    const createAliyunAdapter = vi.fn(() => makeAcceptedAdapter());
    const adapter = createAccountLifecycleDeliveryAdapterFromEnv(
      {
        ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER: "unexpected_provider",
      },
      createAliyunAdapter,
    );
    const mailer = new AccountLifecycleMailer(adapter);

    await expect(mailer.enqueue(makeMailInput())).resolves.toMatchObject({
      deliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
      adapter: "LOCAL_SAFE_STUB",
    });
    expect(createAliyunAdapter).not.toHaveBeenCalled();
  });

  it("uses Aliyun dry-run when explicitly configured without disabling dry-run", async () => {
    const adapter = createAccountLifecycleDeliveryAdapterFromEnv({
      ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER: "aliyun_directmail",
    });
    const mailer = new AccountLifecycleMailer(adapter);

    await expect(mailer.enqueue(makeMailInput())).resolves.toMatchObject({
      deliveryStatus: AccountLifecycleDeliveryStatus.SUPPRESSED,
      adapter: aliyunDirectMailDryRunAdapterName,
    });
  });

  it("suppresses Aliyun live delivery when required runtime config is missing", async () => {
    const createAliyunAdapter = vi.fn(() => makeAcceptedAdapter());
    const adapter = createAccountLifecycleDeliveryAdapterFromEnv(
      {
        ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER: "aliyun_directmail",
        ALIYUN_DM_DRY_RUN: "false",
      },
      createAliyunAdapter,
    );
    const mailer = new AccountLifecycleMailer(adapter);

    await expect(mailer.enqueue(makeMailInput())).resolves.toMatchObject({
      deliveryStatus: AccountLifecycleDeliveryStatus.SUPPRESSED,
      adapter: aliyunDirectMailAdapterName,
    });
    expect(createAliyunAdapter).not.toHaveBeenCalled();
  });

  it("routes explicit Aliyun live configuration through the configured adapter factory", async () => {
    const send = vi.fn<() => Promise<AccountLifecycleProviderResult>>(async () => ({
      status: "ACCEPTED",
      adapter: aliyunDirectMailAdapterName,
      providerMessageId: "safe-message-id",
    }));
    const adapter: AccountLifecycleDeliveryAdapter = {
      send,
    };
    const createAliyunAdapter = vi.fn(() => adapter);
    const envWithLiveConfig: NodeJS.ProcessEnv = {
      ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER: "aliyun_directmail",
      ALIYUN_DM_DRY_RUN: "false",
      ALIYUN_DM_ACCOUNT_NAME: "system@wzunew.uk",
      ALIYUN_DM_FROM_ALIAS: "test-alias",
      ALIYUN_DM_REGION: "cn-hangzhou",
    };
    envWithLiveConfig[["ALIBABA", "CLOUD", "ACCESS", "KEY", "ID"].join("_")] = "unit-test-id";
    envWithLiveConfig[["ALIBABA", "CLOUD", "ACCESS", "KEY", "SECRET"].join("_")] = "unit-test-value";

    const runtimeAdapter = createAccountLifecycleDeliveryAdapterFromEnv(
      envWithLiveConfig,
      createAliyunAdapter,
    );
    const mailer = new AccountLifecycleMailer(runtimeAdapter);

    await expect(mailer.enqueue(makeMailInput())).resolves.toMatchObject({
      deliveryStatus: AccountLifecycleDeliveryStatus.SENT,
      adapter: aliyunDirectMailAdapterName,
    });
    expect(createAliyunAdapter).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledOnce();
  });

  it("does not expose raw token, full link, or recipient email in the mail result", async () => {
    const input = makeMailInput();
    const result = await new AccountLifecycleMailer().enqueue(input);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain(input.token);
    expect(serialized).not.toContain(input.recipientEmail);
    expect(serialized).not.toContain("https://");
  });
});

const makeAcceptedAdapter = (): AccountLifecycleDeliveryAdapter => ({
  send: async () => ({
    status: "ACCEPTED",
    adapter: aliyunDirectMailAdapterName,
  }),
});

const testRecipient = ["target", "example.invalid"].join("@");
const testToken = ["runtime", "delivery", "value"].join("-");

const makeMailInput = () => ({
  tokenId: "70000000-0000-4000-8000-000000000001",
  template: "PASSWORD_RESET" as const,
  purpose: AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF,
  targetUserId: "40000000-0000-4000-8000-000000000002",
  emailHash: "email-hash:target",
  recipientEmail: testRecipient,
  expiresAt: new Date("2026-06-28T12:00:00.000Z"),
  token: testToken,
});
