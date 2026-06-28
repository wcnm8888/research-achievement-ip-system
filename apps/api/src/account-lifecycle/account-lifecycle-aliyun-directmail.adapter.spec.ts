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
  createAliyunDirectMailClientConfig,
  createAliyunDirectMailConfigFromEnv,
  createAliyunDirectMailSafeDryRunSummary,
  normalizeAliyunDirectMailErrorCode,
  resolveAliyunDirectMailEndpoint,
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

  it("resolves the documented cn-hangzhou DirectMail endpoint", () => {
    expect(resolveAliyunDirectMailEndpoint("cn-hangzhou")).toBe("dm.aliyuncs.com");
    expect(resolveAliyunDirectMailEndpoint("CN-HANGZHOU")).toBe("dm.aliyuncs.com");
    expect(resolveAliyunDirectMailEndpoint("ap-southeast-1")).toBe("dm.ap-southeast-1.aliyuncs.com");
    expect(resolveAliyunDirectMailEndpoint("bad region")).toBe("dm.aliyuncs.com");
  });

  it("builds Aliyun client config with the resolved endpoint", () => {
    const clientConfig = createAliyunDirectMailClientConfig(makeConfig({ dryRun: false }));

    expect(clientConfig).toMatchObject({
      regionId: "cn-hangzhou",
      endpoint: "dm.aliyuncs.com",
    });
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
      providerErrorCode: "Throttling.User",
      failureCategory: "RATE_LIMITED",
    });
  });

  it("maps Aliyun auth and permission failures to safe configuration results", async () => {
    const accessDenied = await sendWithAliyunError({ code: "SignatureDoesNotMatch" });
    const forbidden = await sendWithAliyunError({ code: "Forbidden.RAM" });

    expect(accessDenied).toEqual({
      deliveryStatus: "FAILED",
      adapter: aliyunDirectMailAdapterName,
      providerMessageId: undefined,
      providerErrorCode: "SignatureDoesNotMatch",
      failureCategory: "CONFIGURATION",
    });
    expect(forbidden.failureCategory).toBe("CONFIGURATION");
    expect(forbidden.providerErrorCode).toBe("Forbidden.RAM");
  });

  it("maps invalid sender/account/address failures to safe configuration results", async () => {
    const invalidSender = await sendWithAliyunError({
      response: { body: { Code: "InvalidMailAddress.NotFound" } },
    });
    const invalidAlias = await sendWithAliyunError({ code: "InvalidFromAlias.Malformed" });

    expect(invalidSender.failureCategory).toBe("CONFIGURATION");
    expect(invalidSender.providerErrorCode).toBe("InvalidMailAddress.NotFound");
    expect(invalidAlias.failureCategory).toBe("CONFIGURATION");
    expect(invalidAlias.providerErrorCode).toBe("InvalidFromAlias.Malformed");
  });

  it("maps network and timeout failures to temporary safe results", async () => {
    const timeout = await sendWithAliyunError({ code: "TimeoutError" });
    const reset = await sendWithAliyunError({ name: "ECONNRESET" });

    expect(timeout).toEqual({
      deliveryStatus: "QUEUED",
      adapter: aliyunDirectMailAdapterName,
      providerMessageId: undefined,
      providerErrorCode: "TimeoutError",
      failureCategory: "TEMPORARY",
    });
    expect(reset.failureCategory).toBe("TEMPORARY");
    expect(reset.providerErrorCode).toBe("ECONNRESET");
  });

  it("drops unsafe Aliyun provider error codes before safe projection", async () => {
    const unsafeCode = "InvalidMailAddress.user@example.invalid";
    const normalized = await sendWithAliyunError({ code: unsafeCode });
    const safeCode = normalizeAliyunDirectMailErrorCode({ code: unsafeCode });

    expect(safeCode).toBeUndefined();
    expect(normalized.providerErrorCode).toBeUndefined();
    expect(normalized.failureCategory).toBe("PERMANENT");
  });
});

const sendWithAliyunError = async (error: unknown) => {
  const adapter = new AliyunDirectMailAdapter(
    makeConfig({ dryRun: false }),
    () => ({
      singleSendMail: vi.fn(async () => {
        throw error;
      }),
    }),
  );

  return normalizeAccountLifecycleProviderResult(await adapter.send(makeDeliveryInput()));
};

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
