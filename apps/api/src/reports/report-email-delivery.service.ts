import DirectMailClient, { SingleSendMailRequest } from "@alicloud/dm20151123";
import { Inject, Injectable, Optional } from "@nestjs/common";
import {
  createAliyunDirectMailClientConfig,
  normalizeAliyunDirectMailErrorCode,
} from "../account-lifecycle/account-lifecycle-aliyun-directmail.adapter";

export type ReportEmailDeliveryInput = {
  deliveryId: string;
  toAddress: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
};

export type ReportEmailDeliveryResult = {
  status:
    | "SENT"
    | "DRY_RUN"
    | "SUPPRESSED"
    | "FAILED"
    | "TEMPORARY_FAILURE"
    | "RATE_LIMITED";
  adapter: string;
  providerMessageId?: string;
  providerErrorCode?: string;
  failureCategory?: "SUPPRESSED" | "CONFIGURATION" | "TEMPORARY" | "RATE_LIMITED" | "PERMANENT";
  attemptCount: number;
  dryRun: boolean;
};

type ReportEmailConfig = {
  provider: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  accountName: string;
  fromAlias: string;
  region: string;
  dryRun: boolean;
  maxAttempts: number;
};

type ReportDirectMailClient = {
  singleSendMail(request: SingleSendMailRequest): Promise<{ body?: { requestId?: string } }>;
};

type ReportDirectMailClientFactory = (config: ReportEmailConfig) => ReportDirectMailClient;

export const reportEmailConfigToken = Symbol("REPORT_EMAIL_CONFIG");
export const reportEmailClientFactoryToken = Symbol("REPORT_EMAIL_CLIENT_FACTORY");

@Injectable()
export class ReportEmailDeliveryService {
  constructor(
    @Inject(reportEmailConfigToken)
    private readonly config: ReportEmailConfig = createReportEmailConfigFromEnv(),
    @Optional()
    @Inject(reportEmailClientFactoryToken)
    private readonly createClient: ReportDirectMailClientFactory = createReportDirectMailClient,
  ) {}

  async send(input: ReportEmailDeliveryInput): Promise<ReportEmailDeliveryResult> {
    if (this.config.provider !== "aliyun_directmail") {
      return {
        status: "DRY_RUN",
        adapter: "REPORT_EMAIL_LOCAL_DRY_RUN",
        providerMessageId: `dry-run-${input.deliveryId}`,
        failureCategory: "SUPPRESSED",
        attemptCount: 1,
        dryRun: true,
      };
    }

    if (this.config.dryRun) {
      return {
        status: "DRY_RUN",
        adapter: "ALIYUN_DIRECTMAIL_DRY_RUN",
        providerMessageId: `dry-run-${input.deliveryId}`,
        failureCategory: "SUPPRESSED",
        attemptCount: 1,
        dryRun: true,
      };
    }

    if (!isLiveAliyunConfigUsable(this.config)) {
      return {
        status: "SUPPRESSED",
        adapter: "ALIYUN_DIRECTMAIL",
        failureCategory: "CONFIGURATION",
        attemptCount: 1,
        dryRun: false,
      };
    }

    let lastResult: ReportEmailDeliveryResult | null = null;
    const request = buildReportDirectMailRequest(input, this.config);
    const maxAttempts = Math.max(1, Math.min(this.config.maxAttempts, 3));

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.createClient(this.config).singleSendMail(request);
        return {
          status: "SENT",
          adapter: "ALIYUN_DIRECTMAIL",
          providerMessageId: response.body?.requestId,
          attemptCount: attempt,
          dryRun: false,
        };
      } catch (error) {
        lastResult = mapReportDirectMailError(error, attempt);
        if (!isRetryableReportEmailResult(lastResult)) {
          return lastResult;
        }
      }
    }

    return lastResult ?? {
      status: "FAILED",
      adapter: "ALIYUN_DIRECTMAIL",
      failureCategory: "PERMANENT",
      attemptCount: maxAttempts,
      dryRun: false,
    };
  }
}

export const createReportEmailConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): ReportEmailConfig => ({
  provider: optionalTrim(env.REPORT_EMAIL_DELIVERY_PROVIDER)
    ?? optionalTrim(env.ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER)
    ?? "local_stub",
  accessKeyId: optionalTrim(env.ALIBABA_CLOUD_ACCESS_KEY_ID),
  accessKeySecret: optionalTrim(env.ALIBABA_CLOUD_ACCESS_KEY_SECRET),
  accountName: optionalTrim(env.REPORT_EMAIL_ACCOUNT_NAME)
    ?? optionalTrim(env.ALIYUN_DM_ACCOUNT_NAME)
    ?? "system@wzunew.uk",
  fromAlias: optionalTrim(env.REPORT_EMAIL_FROM_ALIAS)
    ?? optionalTrim(env.ALIYUN_DM_FROM_ALIAS)
    ?? defaultFromAlias,
  region: optionalTrim(env.REPORT_EMAIL_REGION) ?? optionalTrim(env.ALIYUN_DM_REGION) ?? "cn-hangzhou",
  dryRun: resolveReportEmailDryRun(env),
  maxAttempts: normalizeMaxAttempts(optionalTrim(env.REPORT_EMAIL_MAX_ATTEMPTS)),
});

const buildReportDirectMailRequest = (
  input: ReportEmailDeliveryInput,
  config: ReportEmailConfig,
): SingleSendMailRequest =>
  new SingleSendMailRequest({
    accountName: config.accountName,
    addressType: 1,
    fromAlias: config.fromAlias,
    replyToAddress: false,
    subject: input.subject,
    htmlBody: input.htmlBody,
    textBody: input.textBody,
    toAddress: input.toAddress,
  });

const createReportDirectMailClient: ReportDirectMailClientFactory = (config) =>
  new DirectMailClient(
    createAliyunDirectMailClientConfig({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      accountName: config.accountName,
      fromAlias: config.fromAlias,
      publicBaseUrl: "https://production.wangyimin.cn/",
      region: config.region,
      dryRun: config.dryRun,
    }),
  );

const isLiveAliyunConfigUsable = (config: ReportEmailConfig): boolean =>
  Boolean(
    config.accessKeyId &&
      config.accessKeySecret &&
      config.accountName &&
      config.fromAlias &&
      config.region,
  );

const mapReportDirectMailError = (
  error: unknown,
  attemptCount: number,
): ReportEmailDeliveryResult => {
  const providerErrorCode = normalizeAliyunDirectMailErrorCode(error);
  const failureCategory = classifyReportEmailFailure(providerErrorCode);
  return {
    status: mapFailureCategoryToStatus(failureCategory),
    adapter: "ALIYUN_DIRECTMAIL",
    providerErrorCode,
    failureCategory,
    attemptCount,
    dryRun: false,
  };
};

const classifyReportEmailFailure = (
  providerErrorCode: string | undefined,
): ReportEmailDeliveryResult["failureCategory"] => {
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

const mapFailureCategoryToStatus = (
  failureCategory: ReportEmailDeliveryResult["failureCategory"],
): ReportEmailDeliveryResult["status"] => {
  if (failureCategory === "RATE_LIMITED") {
    return "RATE_LIMITED";
  }
  if (failureCategory === "TEMPORARY") {
    return "TEMPORARY_FAILURE";
  }
  return "FAILED";
};

const isRetryableReportEmailResult = (result: ReportEmailDeliveryResult): boolean =>
  result.failureCategory === "TEMPORARY" || result.failureCategory === "RATE_LIMITED";

const resolveReportEmailDryRun = (env: NodeJS.ProcessEnv): boolean => {
  const reportDryRun = optionalTrim(env.REPORT_EMAIL_DRY_RUN);
  if (reportDryRun) {
    return reportDryRun !== "false";
  }
  return env.ALIYUN_DM_DRY_RUN !== "false";
};

const normalizeMaxAttempts = (value: string | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 3;
  }
  return Math.max(1, Math.min(Math.trunc(parsed), 3));
};

const optionalTrim = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const defaultFromAlias = "Research IP System";
