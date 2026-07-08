import type { ApiError } from "./api-client";

const sensitiveErrorPattern =
  /(cannot\s+(get|post|put|patch|delete)|\/api\/|\/settings\/|\/audit-logs|raw\s*(error|json|response|payload)?|endpoint|stack|trace|json|not\s+production|mock-demo|mock)/i;

const genericSafeDetail = "当前信息暂不可用，请稍后重试或联系管理员处理。";

export const getDemoSafeErrorMessage = (error: Pick<ApiError, "kind" | "message">): string => {
  if (isEngineeringText(error.message)) {
    return getFallbackMessage(error.kind);
  }

  return error.message || getFallbackMessage(error.kind);
};

export const getDemoSafeErrorDetail = (
  error: Pick<ApiError, "kind" | "detail" | "message">,
): string | undefined => {
  const detail = error.detail?.trim();

  if (!detail) {
    return getDefaultDetail(error.kind);
  }

  if (isEngineeringText(detail)) {
    return getDefaultDetail(error.kind) ?? genericSafeDetail;
  }

  return detail;
};

export const toDemoSafeApiError = (error: ApiError): ApiError => ({
  ...error,
  message: getDemoSafeErrorMessage(error),
  detail: getDemoSafeErrorDetail(error),
});

export const sanitizeUnknownErrorDetail = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return sanitizeErrorText(error.message, genericSafeDetail);
};

export const sanitizeErrorText = (
  value: string | null | undefined,
  fallback: string | undefined = genericSafeDetail,
): string | undefined => {
  const text = value?.trim();

  if (!text) {
    return undefined;
  }

  return isEngineeringText(text) ? fallback : text;
};

const isEngineeringText = (value: string | null | undefined): boolean =>
  Boolean(value && sensitiveErrorPattern.test(value));

const getFallbackMessage = (kind: ApiError["kind"]): string => {
  if (kind === "unauthorized") {
    return "请选择或切换业务用户";
  }

  if (kind === "forbidden") {
    return "当前角色无权限";
  }

  if (kind === "bad-request") {
    return "请求参数需要调整";
  }

  if (kind === "network" || kind === "server") {
    return "服务暂不可用";
  }

  return "请求暂未完成";
};

const getDefaultDetail = (kind: ApiError["kind"]): string | undefined => {
  if (kind === "unauthorized") {
    return "请选择有权限的业务用户后重试。";
  }

  if (kind === "forbidden") {
    return "当前账号没有执行该操作的权限。";
  }

  if (kind === "network") {
    return "请确认本地演示服务已启动，然后重试。";
  }

  if (kind === "server") {
    return "请稍后重试，或联系管理员查看本地服务状态。";
  }

  return undefined;
};
