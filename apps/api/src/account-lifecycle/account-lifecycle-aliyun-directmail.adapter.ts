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
  new DirectMailClient({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    regionId: config.region,
    endpoint: `dm.${config.region}.aliyuncs.com`,
  } as ConstructorParameters<typeof DirectMailClient>[0]);

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
    ? inviteSubject
    : passwordResetSubject;

const renderAliyunDirectMailTextBody = (
  input: AccountLifecycleDeliveryInput,
  link: string,
): string => {
  const expiresAtText = input.expiresAt.toISOString();
  if (input.template === "INVITE_ACCEPT") {
    return [
      inviteIntro,
      inviteInstruction,
      `${linkLabel}${link}`,
      `${expiresAtLabel}${expiresAtText}`,
      expiryInstruction,
    ].join("\n");
  }

  return [
    passwordResetIntro,
    passwordResetInstruction,
    `${linkLabel}${link}`,
    `${expiresAtLabel}${expiresAtText}`,
    expiryInstruction,
  ].join("\n");
};

const mapAliyunDirectMailError = (error: unknown): AccountLifecycleProviderResult => {
  const category = classifyAliyunDirectMailFailure(error);
  return {
    status: category === "RATE_LIMITED" ? "RATE_LIMITED" : "FAILED",
    adapter: aliyunDirectMailAdapterName,
    failureCategory: category,
  };
};

const classifyAliyunDirectMailFailure = (error: unknown): AccountLifecycleDeliveryFailureCategory => {
  const code = getAliyunErrorCode(error).toLowerCase();
  if (code.includes("throttl") || code.includes("ratelimit") || code.includes("flowcontrol")) {
    return "RATE_LIMITED";
  }
  if (code.includes("invalidaccesskey") || code.includes("forbidden") || code.includes("unauthorized")) {
    return "CONFIGURATION";
  }
  return "PERMANENT";
};

const getAliyunErrorCode = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "";
  }
  const record = error as { code?: unknown; name?: unknown };
  return String(record.code ?? record.name ?? "");
};

const normalizePublicBaseUrl = (publicBaseUrl: string): string => {
  const trimmed = publicBaseUrl.trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

const optionalTrim = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const defaultFromAlias = "\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf";
const inviteSubject = "\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf\u8d26\u53f7\u9080\u8bf7";
const passwordResetSubject = "\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf\u5bc6\u7801\u91cd\u7f6e";
const inviteIntro = "\u60a8\u5df2\u88ab\u9080\u8bf7\u52a0\u5165\u79d1\u7814\u6210\u679c\u7ba1\u7406\u7cfb\u7edf\u3002";
const inviteInstruction =
  "\u8bf7\u5728\u94fe\u63a5\u6709\u6548\u671f\u5185\u5b8c\u6210\u8d26\u53f7\u8bbe\u7f6e\uff1b\u5982\u94fe\u63a5\u8fc7\u671f\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u91cd\u65b0\u53d1\u9001\u9080\u8bf7\u3002";
const passwordResetIntro = "\u6211\u4eec\u6536\u5230\u4e86\u60a8\u7684\u5bc6\u7801\u91cd\u7f6e\u8bf7\u6c42\u3002";
const passwordResetInstruction =
  "\u8bf7\u5728\u94fe\u63a5\u6709\u6548\u671f\u5185\u5b8c\u6210\u5bc6\u7801\u91cd\u7f6e\uff1b\u5982\u975e\u672c\u4eba\u64cd\u4f5c\uff0c\u8bf7\u5ffd\u7565\u6b64\u90ae\u4ef6\u6216\u8054\u7cfb\u7ba1\u7406\u5458\u3002";
const linkLabel = "\u94fe\u63a5\uff1a";
const expiresAtLabel = "\u8fc7\u671f\u65f6\u95f4\uff1a";
const expiryInstruction =
  "\u94fe\u63a5\u5c06\u5728\u7cfb\u7edf\u914d\u7f6e\u7684\u6709\u6548\u671f\u540e\u5931\u6548\uff0c\u8fc7\u671f\u540e\u9700\u91cd\u65b0\u7533\u8bf7\u3002";
