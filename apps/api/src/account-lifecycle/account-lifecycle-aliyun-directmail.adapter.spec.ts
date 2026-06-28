import { AccountLifecycleTokenPurpose } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  createAccountLifecycleSafeDeliveryProjection,
  normalizeAccountLifecycleProviderResult,
} from "./account-lifecycle-delivery";
import {
  AliyunDirectMailAdapter,
  AliyunDirectMailConfig,
  aliyunDirectMailAdapterName,
  aliyunDirectMailDryRunAdapterName,
  buildAliyunDirectMailRequest,
  buildLifecycleLink,
  createAliyunDirectMailConfigFromEnv,
  createAliyunDirectMailSafeDryRunSummary,
} from "./account-lifecycle-aliyun-directmail.adapter";

describe("AliyunDirectMailAdapter", () => {
  it("defaults to dry-run config without reading secret values in tests", () => {
    const config = createAliyunDirectMailConfigFromEnv({});

    expect(config).toEqual({
      accessKeyId: undefined,
      accessKeySecret: undefined,
      accountName: "system@wzunew.uk",
      fromAlias: defaultFromAlias,
      publicBaseUrl: "https://production.wangyimin.cn/",
      region: "cn-hangzhou",
      dryRun: true,
    });
  });

  it("does not call the Aliyun client in dry-run mode and keeps safe projections clean", async () => {
    const singleSendMail = vi.fn();
    const adapter = new AliyunDirectMailAdapter(
      makeConfig({ dryRun: true }),
      () => ({ singleSendMail }),
    );

    const input = makeDeliveryInput();
    const providerResult = await adapter.send(input);
    const normalized = normalizeAccountLifecycleProviderResult(providerResult);
    const projection = createAccountLifecycleSafeDeliveryProjection(input, normalized);
    const dryRunSummary = createAliyunDirectMailSafeDryRunSummary(input, providerResult);
    const serializedSafeData = JSON.stringify([projection, dryRunSummary]);

    expect(singleSendMail).not.toHaveBeenCalled();
    expect(providerResult).toEqual({
      status: "SUPPRESSED",
      adapter: aliyunDirectMailDryRunAdapterName,
      providerMessageId: `dry-run-${input.deliveryId}`,
      failureCategory: "SUPPRESSED",
    });
    expect(normalized.deliveryStatus).toBe("SUPPRESSED");
    expect(serializedSafeData).not.toContain(input.rawToken);
    expect(serializedSafeData).not.toContain(input.recipientEmail);
    expect(serializedSafeData).not.toContain(input.publicBaseUrl);
    expect(serializedSafeData).not.toContain("flow=reset-password");
  });

  it("suppresses delivery when live-send config is incomplete", async () => {
    const singleSendMail = vi.fn();
    const adapter = new AliyunDirectMailAdapter(
      makeConfig({ dryRun: false, accessKeyId: undefined, accessKeySecret: undefined }),
      () => ({ singleSendMail }),
    );

    await expect(adapter.send(makeDeliveryInput())).resolves.toEqual({
      status: "SUPPRESSED",
      adapter: aliyunDirectMailAdapterName,
      failureCategory: "CONFIGURATION",
    });
    expect(singleSendMail).not.toHaveBeenCalled();
  });

  it("builds the transient provider request with the link only in memory", () => {
    const input = makeDeliveryInput();
    const request = buildAliyunDirectMailRequest(input, makeConfig({ dryRun: true }));
    const link = buildLifecycleLink(input, "https://production.wangyimin.cn/");

    expect(request.accountName).toBe("system@wzunew.uk");
    expect(request.fromAlias).toBe(defaultFromAlias);
    expect(request.toAddress).toBe(input.recipientEmail);
    expect(request.subject).toBe(defaultPasswordResetSubject);
    expect(request.textBody).toContain(link);
    const parsedLink = new URL(link);
    expect(parsedLink.searchParams.get("flow")).toBe("reset-password");
    expect(parsedLink.searchParams.get("token")).toBe(input.rawToken);
  });

  it("normalizes unsafe provider message ids returned by Aliyun before persistence", async () => {
    const adapter = new AliyunDirectMailAdapter(
      makeConfig({ dryRun: false }),
      () => ({
        singleSendMail: vi.fn(async () => ({
          body: {
            requestId: "https://dm.aliyun.invalid/messages?password=redacted",
          },
        })),
      }),
    );

    const input = makeDeliveryInput();
    const normalized = normalizeAccountLifecycleProviderResult(await adapter.send(input));
    const projection = createAccountLifecycleSafeDeliveryProjection(input, normalized);

    expect(normalized.deliveryStatus).toBe("SENT");
    expect(normalized.providerMessageId).toBeUndefined();
    expect(JSON.stringify(projection)).not.toContain("raw-lifecycle-token");
    expect(JSON.stringify(projection)).not.toContain("https://");
  });

  it("maps Aliyun throttling failures to a safe queued status through provider normalization", async () => {
    const adapter = new AliyunDirectMailAdapter(
      makeConfig({ dryRun: false }),
      () => ({
        singleSendMail: vi.fn(async () => {
          throw { code: "Throttling.User" };
        }),
      }),
    );

    const normalized = normalizeAccountLifecycleProviderResult(await adapter.send(makeDeliveryInput()));

    expect(normalized).toEqual({
      deliveryStatus: "QUEUED",
      adapter: aliyunDirectMailAdapterName,
      providerMessageId: undefined,
      failureCategory: "RATE_LIMITED",
    });
  });
});

const makeConfig = (overrides: Partial<AliyunDirectMailConfig>): AliyunDirectMailConfig => ({
  accessKeyId: "test-access-key-id",
  accessKeySecret: "test-access-key-secret",
  accountName: "system@wzunew.uk",
  fromAlias: defaultFromAlias,
  publicBaseUrl: "https://production.wangyimin.cn/",
  region: "cn-hangzhou",
  dryRun: true,
  ...overrides,
});

const makeDeliveryInput = () => ({
  deliveryId: "80000000-0000-4000-8000-000000000001",
  tokenId: "70000000-0000-4000-8000-000000000001",
  purpose: AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF,
  template: "PASSWORD_RESET" as const,
  targetUserId: "40000000-0000-4000-8000-000000000002",
  emailHash: "email-hash:target",
  recipientEmail: "target@example.invalid",
  expiresAt: new Date("2026-06-28T12:00:00.000Z"),
  rawToken: "raw-lifecycle-token",
  publicBaseUrl: "https://production.wangyimin.cn/",
  correlationId: "corr-step47h",
});

const defaultFromAlias = "\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf";
const defaultPasswordResetSubject = "\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf\u5bc6\u7801\u91cd\u7f6e";
