import DirectMailClient, { SingleSendMailRequest } from "@alicloud/dm20151123";
import { AccountLifecycleTokenPurpose } from "@prisma/client";
import {
  AccountLifecycleDeliveryAdapter,
  AccountLifecycleDeliveryFailureCategory,
  AccountLifecycleDeliveryInput,
  AccountLifecycleProviderResult,
} from "./account-lifecycle-delivery";

export const aliyunDirectMailAdapterName = "ALIYUN_DIRECTMAIL";
export const aliyunDirectMailDryRunAdapterName = "ALIYUN_DIRECTMAIL_DRY_RUN";

export type AliyunDirectMailConfig = {
  accessKeyId?: string;
  accessKeySecret?: string;
  accountName: string;
  fromAlias: string;
  publicBaseUrl: string;
  region: string;
  dryRun: boolean;
};

type AliyunDirectMailClient = {
  singleSendMail(request: SingleSendMailRequest): Promise<AliyunDirectMailResponse>;
};

type AliyunDirectMailResponse = {
  body?: {
    requestId?: string;
  };
};

type AliyunDirectMailClientFactory = (config: AliyunDirectMailConfig) => AliyunDirectMailClient;

export const createAliyunDirectMailConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): AliyunDirectMailConfig => ({
  accessKeyId: optionalTrim(env.ALIBABA_CLOUD_ACCESS_KEY_ID),
  accessKeySecret: optionalTrim(env.ALIBABA_CLOUD_ACCESS_KEY_SECRET),
  accountName: optionalTrim(env.ALIYUN_DM_ACCOUNT_NAME) ?? "system@wzunew.uk",
  fromAlias: optionalTrim(env.ALIYUN_DM_FROM_ALIAS) ?? defaultFromAlias,
  publicBaseUrl: normalizePublicBaseUrl(
    optionalTrim(env.ACCOUNT_LIFECYCLE_PUBLIC_BASE_URL) ?? "https://production.wangyimin.cn/",
  ),
  region: optionalTrim(env.ALIYUN_DM_REGION) ?? "cn-hangzhou",
  dryRun: env.ALIYUN_DM_DRY_RUN !== "false",
});

export class AliyunDirectMailAdapter implements AccountLifecycleDeliveryAdapter {
  constructor(
    private readonly config: AliyunDirectMailConfig,
    private readonly createClient: AliyunDirectMailClientFactory = createAliyunDirectMailClient,
  ) {}

  async send(input: AccountLifecycleDeliveryInput): Promise<AccountLifecycleProviderResult> {
    if (!isAliyunDirectMailConfigUsable(this.config)) {
      return {
        status: "SUPPRESSED",
        adapter: aliyunDirectMailAdapterName,
        failureCategory: "CONFIGURATION",
      };
    }

    const request = buildAliyunDirectMailRequest(input, this.config);
    if (this.config.dryRun) {
      return {
        status: "SUPPRESSED",
        adapter: aliyunDirectMailDryRunAdapterName,
        providerMessageId: `dry-run-${input.deliveryId}`,
        failureCategory: "SUPPRESSED",
      };
    }

    try {
      const response = await this.createClient(this.config).singleSendMail(request);
      return {
        status: "ACCEPTED",
        adapter: aliyunDirectMailAdapterName,
        providerMessageId: response.body?.requestId,
      };
    } catch (error) {
      return mapAliyunDirectMailError(error);
    }
  }
}

export const buildAliyunDirectMailRequest = (
  input: AccountLifecycleDeliveryInput,
  config: AliyunDirectMailConfig,
): SingleSendMailRequest =>
  new SingleSendMailRequest({
    accountName: config.accountName,
    addressType: 1,
    fromAlias: config.fromAlias,
    replyToAddress: false,
    subject: renderAliyunDirectMailSubject(input),
    htmlBody: renderAliyunDirectMailHtmlBody(input, buildLifecycleLink(input, config.publicBaseUrl)),
    textBody: renderAliyunDirectMailTextBody(input, buildLifecycleLink(input, config.publicBaseUrl)),
    toAddress: input.recipientEmail,
  });

export const buildLifecycleLink = (
  input: Pick<AccountLifecycleDeliveryInput, "purpose" | "rawToken">,
  publicBaseUrl: string,
): string => {
  const url = new URL(normalizePublicBaseUrl(publicBaseUrl));
  url.searchParams.set("flow", input.purpose === AccountLifecycleTokenPurpose.INVITE_ACCEPT ? "invite-accept" : "reset-password");
  url.searchParams.set("token", input.rawToken);
  return url.toString();
};

export const createAliyunDirectMailSafeDryRunSummary = (
  input: AccountLifecycleDeliveryInput,
  result: AccountLifecycleProviderResult,
) => ({
  tokenId: input.tokenId,
  targetUserId: input.targetUserId,
  emailHash: input.emailHash,
  correlationId: input.correlationId,
  adapter: result.adapter,
  status: result.status,
  providerMessageId: result.providerMessageId,
  failureCategory: result.failureCategory,
});

const createAliyunDirectMailClient: AliyunDirectMailClientFactory = (config) =>
  new DirectMailClient(createAliyunDirectMailClientConfig(config));

export const createAliyunDirectMailClientConfig = (
  config: AliyunDirectMailConfig,
): ConstructorParameters<typeof DirectMailClient>[0] =>
  ({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    regionId: config.region,
    endpoint: resolveAliyunDirectMailEndpoint(config.region),
  }) as ConstructorParameters<typeof DirectMailClient>[0];

export const resolveAliyunDirectMailEndpoint = (region: string): string => {
  const normalizedRegion = region.trim().toLowerCase();
  const mappedEndpoint = aliyunDirectMailEndpointByRegion[normalizedRegion];
  if (mappedEndpoint) {
    return mappedEndpoint;
  }
  if (!safeAliyunRegionPattern.test(normalizedRegion)) {
    return defaultAliyunDirectMailEndpoint;
  }
  return `dm.${normalizedRegion}.aliyuncs.com`;
};

const isAliyunDirectMailConfigUsable = (config: AliyunDirectMailConfig): boolean =>
  Boolean(
    config.accountName &&
      config.fromAlias &&
      config.publicBaseUrl &&
      config.region &&
      (config.dryRun || (config.accessKeyId && config.accessKeySecret)),
  );

const renderAliyunDirectMailSubject = (input: AccountLifecycleDeliveryInput): string =>
  input.template === "INVITE_ACCEPT"
    ? inviteSubjectAscii
    : passwordResetSubjectAscii;

const renderAliyunDirectMailTextBody = (
  input: AccountLifecycleDeliveryInput,
  link: string,
): string => {
  const expiresAtText = input.expiresAt.toISOString();
  if (input.template === "INVITE_ACCEPT") {
    return [
      "Research IP System account invitation.",
      "Open the link before it expires to activate your account.",
      `Link: ${link}`,
      `Expires at: ${expiresAtText}`,
    ].join("\n");
  }

  return [
    "Research IP System password reset.",
    "Open the link before it expires to reset your password.",
    `Link: ${link}`,
    `Expires at: ${expiresAtText}`,
  ].join("\n");
};

const renderAliyunDirectMailHtmlBody = (
  input: AccountLifecycleDeliveryInput,
  link: string,
): string => {
  const title =
    input.template === "INVITE_ACCEPT"
      ? "科研成果管理系统账号邀请"
      : "科研成果管理系统密码重置";
  const intro = input.template === "INVITE_ACCEPT" ? inviteIntro : passwordResetIntro;
  const instruction =
    input.template === "INVITE_ACCEPT" ? inviteInstruction : passwordResetInstruction;
  const expiresAtText = input.expiresAt.toISOString();

  return [
    '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;max-width:680px;margin:0 auto;border:1px solid #dbe3ea;border-radius:8px;overflow:hidden">',
    '<div style="background:#0f6b7d;color:#fff;padding:20px 28px">',
    `<h1 style="font-size:20px;margin:0">${escapeLifecycleHtml(title)}</h1>`,
    '<p style="font-size:14px;margin:8px 0 0">local-demo / DirectMail live verification</p>',
    '</div>',
    '<div style="padding:24px 28px">',
    `<p>${escapeLifecycleHtml(intro)}</p>`,
    `<p>${escapeLifecycleHtml(instruction)}</p>`,
    `<p><a href="${escapeLifecycleHtml(link)}" style="color:#0f6b7d;font-weight:700">${escapeLifecycleHtml("打开系统链接")}</a></p>`,
    `<p style="color:#52627a">${escapeLifecycleHtml("过期时间：")}${escapeLifecycleHtml(expiresAtText)}</p>`,
    `<p style="color:#52627a">${escapeLifecycleHtml(expiryInstruction)}</p>`,
    '</div>',
    '</div>',
  ].join("");
};

const mapAliyunDirectMailError = (error: unknown): AccountLifecycleProviderResult => {
  const providerErrorCode = normalizeAliyunDirectMailErrorCode(error);
  const category = classifyAliyunDirectMailFailure(providerErrorCode);
  return {
    status: mapAliyunFailureCategoryToProviderStatus(category),
    adapter: aliyunDirectMailAdapterName,
    providerErrorCode,
    failureCategory: category,
  };
};

export const normalizeAliyunDirectMailErrorCode = (error: unknown): string | undefined => {
  for (const candidate of getAliyunErrorCodeCandidates(error)) {
    const normalized = normalizeSafeAliyunDiagnosticCode(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
};

const classifyAliyunDirectMailFailure = (
  providerErrorCode: string | undefined,
): AccountLifecycleDeliveryFailureCategory => {
  const code = providerErrorCode?.toLowerCase() ?? "";
  if (code.includes("throttl") || code.includes("ratelimit") || code.includes("flowcontrol")) {
    return "RATE_LIMITED";
  }
  if (
    code.includes("timeout") ||
    code.includes("timedout") ||
    code.includes("econnreset") ||
    code.includes("enotfound") ||
    code.includes("network") ||
    code.includes("temporar")
  ) {
    return "TEMPORARY";
  }
  if (
    code.includes("accesskey") ||
    code.includes("signature") ||
    code.includes("forbidden") ||
    code.includes("unauthorized") ||
    code.includes("permission") ||
    code.includes("accessdenied") ||
    code.includes("ram") ||
    code.includes("invalidmailaddress") ||
    code.includes("invalidfromalias") ||
    code.includes("invalidsender") ||
    code.includes("invalidaccount")
  ) {
    return "CONFIGURATION";
  }
  return "PERMANENT";
};

const mapAliyunFailureCategoryToProviderStatus = (
  category: AccountLifecycleDeliveryFailureCategory,
): AccountLifecycleProviderResult["status"] => {
  if (category === "RATE_LIMITED") {
    return "RATE_LIMITED";
  }
  if (category === "TEMPORARY") {
    return "TEMPORARY_FAILURE";
  }
  return "FAILED";
};

const getAliyunErrorCodeCandidates = (error: unknown): string[] => {
  if (!error || typeof error !== "object") {
    return [];
  }
  const record = error as {
    code?: unknown;
    name?: unknown;
    statusCode?: unknown;
    data?: { code?: unknown; Code?: unknown };
    response?: { body?: { code?: unknown; Code?: unknown } };
  };
  return [
    record.code,
    record.name,
    record.data?.code,
    record.data?.Code,
    record.response?.body?.code,
    record.response?.body?.Code,
    typeof record.statusCode === "number" ? `HTTP_${record.statusCode}` : undefined,
  ]
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map(String);
};

const normalizeSafeAliyunDiagnosticCode = (code: string): string | undefined => {
  const trimmed = code.trim();
  if (!trimmed || trimmed.length > aliyunProviderErrorCodeMaxLength) {
    return undefined;
  }
  if (!safeAliyunProviderErrorCodePattern.test(trimmed) || unsafeAliyunProviderErrorCodePattern.test(trimmed)) {
    return undefined;
  }
  return trimmed;
};

const normalizePublicBaseUrl = (publicBaseUrl: string): string => {
  const trimmed = publicBaseUrl.trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

const optionalTrim = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const defaultAliyunDirectMailEndpoint = "dm.aliyuncs.com";
const aliyunDirectMailEndpointByRegion: Record<string, string> = {
  "cn-hangzhou": defaultAliyunDirectMailEndpoint,
};
const safeAliyunRegionPattern = /^[a-z0-9-]+$/;
const aliyunProviderErrorCodeMaxLength = 128;
const safeAliyunProviderErrorCodePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const unsafeAliyunProviderErrorCodePattern =
  /(@|https?:\/\/|token=|cookie=|password=|secret=|key=|-----BEGIN|[\r\n])/i;

const escapeLifecycleHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] ?? char)
    .replace(/[^\x20-\x7E]/g, (char) => `&#${char.codePointAt(0) ?? 0};`);

const htmlEscapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const defaultFromAlias = "Research IP System";
const inviteSubjectAscii = "Research IP System - Account Invitation";
const passwordResetSubjectAscii = "Research IP System - Password Reset";
const inviteIntro = "\u60a8\u5df2\u88ab\u9080\u8bf7\u52a0\u5165\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf\u3002";
const inviteInstruction =
  "\u8bf7\u5728\u94fe\u63a5\u6709\u6548\u671f\u5185\u5b8c\u6210\u8d26\u53f7\u8bbe\u7f6e\uff1b\u5982\u94fe\u63a5\u8fc7\u671f\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u91cd\u65b0\u53d1\u9001\u9080\u8bf7\u3002";
const passwordResetIntro = "\u6211\u4eec\u6536\u5230\u4e86\u60a8\u7684\u5bc6\u7801\u91cd\u7f6e\u8bf7\u6c42\u3002";
const passwordResetInstruction =
  "\u8bf7\u5728\u94fe\u63a5\u6709\u6548\u671f\u5185\u5b8c\u6210\u5bc6\u7801\u91cd\u7f6e\uff1b\u5982\u975e\u672c\u4eba\u64cd\u4f5c\uff0c\u8bf7\u5ffd\u7565\u6b64\u90ae\u4ef6\u6216\u8054\u7cfb\u7ba1\u7406\u5458\u3002";
const expiryInstruction =
  "\u94fe\u63a5\u5c06\u5728\u7cfb\u7edf\u914d\u7f6e\u7684\u6709\u6548\u671f\u540e\u5931\u6548\uff0c\u8fc7\u671f\u540e\u9700\u91cd\u65b0\u7533\u8bf7\u3002";
