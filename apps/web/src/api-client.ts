import type {
  AccountUserDetail,
  AccountUserListResponse,
  ApiIntegrationListResponse,
  ApiIntegrationMetadata,
  ApiIntegrationMockRunInput,
  ApiIntegrationMockRunResponse,
  ApiIntegrationReasonInput,
  ApiCallLogListResponse,
  AssignAccountUserRoleInput,
  AssignAccountUserRoleResponse,
  AchievementImportApplyInput,
  AchievementImportApplyResult,
  AchievementImportDryRunInput,
  AchievementImportDryRunResult,
  ChangeAccountUserDepartmentInput,
  CreateInviteInput,
  CustomReportRunQuery,
  CustomReportRunResponse,
  CustomReportTemplate,
  CreateDepartmentInput,
  CreateAccountUserInput,
  CreateApiIntegrationInput,
  DepartmentDetail,
  DepartmentImportApplyInput,
  DepartmentImportApplyResult,
  DepartmentImportDryRunInput,
  DepartmentImportDryRunResult,
  DepartmentListResponse,
  DepartmentReasonInput,
  DepartmentTreeResponse,
  DisableAccountUserInput,
  DisableAccountUserResponse,
  DisableDepartmentResponse,
  EnableAccountUserInput,
  ApproveFeeReviewInput,
  FeeReviewHistoryEntry,
  FeeStateRecord,
  ImportJobHistoryDetail,
  ImportJobItemHistoryListQuery,
  ImportJobItemHistoryListResponse,
  ImportJobHistoryListQuery,
  ImportJobHistoryListResponse,
  InviteAcceptInput,
  InviteAcceptResponse,
  InviteIssueResponse,
  ListApiIntegrationsQuery,
  ListApiCallLogsQuery,
  ListAccountUsersQuery,
  ListDepartmentsQuery,
  PasswordResetConfirmInput,
  PasswordResetConfirmResponse,
  PasswordResetIssueResponse,
  PasswordResetRequestInput,
  PasswordResetRequestResponse,
  PasswordResetRevokeResponse,
  RevokeAccountUserRoleInput,
  RejectFeeReviewInput,
  SecretAuthorizationOverview,
  SecretAuthorizationResourceDetail,
  SecretAuthorizationResourceList,
  UpdateApiIntegrationInput,
  UpdateDepartmentInput,
  UserAccountImportApplyInput,
  UserAccountImportApplyResult,
  UserAccountImportDryRunInput,
  UserAccountImportDryRunResult,
} from "./types";

export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "bad-request"
  | "server"
  | "network"
  | "unknown";

export type ApiError = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  detail?: string;
  body?: unknown;
};

export type ApiQueryPrimitive = string | number | boolean;
export type ApiQueryValue =
  | ApiQueryPrimitive
  | readonly ApiQueryPrimitive[]
  | null
  | undefined;
export type ApiQuery = Record<string, ApiQueryValue>;

export type ApiClient = {
  get<T>(path: string, query?: ApiQuery): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  postForm?<T>(path: string, body: FormData): Promise<T>;
  put?<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  downloadBlob?(path: string, query?: ApiQuery): Promise<Blob>;
};

export type AccountManagementApiClient = ApiClient & {
  listDepartments(query?: ListDepartmentsQuery): Promise<DepartmentListResponse>;
  getDepartmentTree(query?: ListDepartmentsQuery): Promise<DepartmentTreeResponse>;
  getDepartmentDetail(departmentId: string): Promise<DepartmentDetail>;
  createDepartment(payload: CreateDepartmentInput): Promise<DepartmentDetail>;
  updateDepartment(
    departmentId: string,
    payload: UpdateDepartmentInput,
  ): Promise<DepartmentDetail>;
  disableDepartment(
    departmentId: string,
    payload?: DepartmentReasonInput,
  ): Promise<DisableDepartmentResponse>;
  enableDepartment(
    departmentId: string,
    payload?: DepartmentReasonInput,
  ): Promise<DepartmentDetail>;
  dryRunDepartmentImport(
    input: DepartmentImportDryRunInput,
  ): Promise<DepartmentImportDryRunResult>;
  applyDepartmentImport(
    input: DepartmentImportApplyInput,
  ): Promise<DepartmentImportApplyResult>;
  dryRunUserAccountImport(
    input: UserAccountImportDryRunInput,
  ): Promise<UserAccountImportDryRunResult>;
  applyUserAccountImport(
    input: UserAccountImportApplyInput,
  ): Promise<UserAccountImportApplyResult>;
  dryRunAchievementImport(
    input: AchievementImportDryRunInput,
  ): Promise<AchievementImportDryRunResult>;
  applyAchievementImport(
    input: AchievementImportApplyInput,
  ): Promise<AchievementImportApplyResult>;
  listImportJobHistory(
    query?: ImportJobHistoryListQuery,
  ): Promise<ImportJobHistoryListResponse>;
  getImportJobHistoryDetail(importJobId: string): Promise<ImportJobHistoryDetail>;
  listImportJobHistoryItems(
    importJobId: string,
    query?: ImportJobItemHistoryListQuery,
  ): Promise<ImportJobItemHistoryListResponse>;
  listCustomReportTemplates(): Promise<CustomReportTemplate[]>;
  runCustomReport(
    templateId: string,
    query?: CustomReportRunQuery,
  ): Promise<CustomReportRunResponse>;
  listAccountUsers(query?: ListAccountUsersQuery): Promise<AccountUserListResponse>;
  getAccountUser(userId: string): Promise<AccountUserDetail>;
  createAccountUser(payload: CreateAccountUserInput): Promise<AccountUserDetail>;
  disableAccountUser(
    userId: string,
    payload?: DisableAccountUserInput,
  ): Promise<DisableAccountUserResponse>;
  enableAccountUser(
    userId: string,
    payload?: EnableAccountUserInput,
  ): Promise<AccountUserDetail>;
  assignAccountUserRole(
    userId: string,
    payload: AssignAccountUserRoleInput,
  ): Promise<AssignAccountUserRoleResponse>;
  revokeAccountUserRole(
    userId: string,
    userRoleId: string,
    payload?: RevokeAccountUserRoleInput,
  ): Promise<AccountUserDetail>;
  changeAccountUserDepartment(
    userId: string,
    payload: ChangeAccountUserDepartmentInput,
  ): Promise<AccountUserDetail>;
  createInvite(payload: CreateInviteInput): Promise<InviteIssueResponse>;
  resendInvite(userId: string): Promise<InviteIssueResponse>;
  requestAdminPasswordReset(
    userId: string,
    payload?: { reason?: string | null },
  ): Promise<PasswordResetIssueResponse>;
  revokePasswordResetTokens(
    userId: string,
    payload?: { reason?: string | null },
  ): Promise<PasswordResetRevokeResponse>;
  getSecretAuthorizationOverview(): Promise<SecretAuthorizationOverview>;
  listSecretAuthorizationResources(): Promise<SecretAuthorizationResourceList>;
  getSecretAuthorizationResourceGrants(
    resourceType: string,
    resourceId: string,
  ): Promise<SecretAuthorizationResourceDetail>;
  listApiIntegrations(query?: ListApiIntegrationsQuery): Promise<ApiIntegrationListResponse>;
  getApiIntegration(integrationId: string): Promise<ApiIntegrationMetadata>;
  createApiIntegration(payload: CreateApiIntegrationInput): Promise<ApiIntegrationMetadata>;
  updateApiIntegration(
    integrationId: string,
    payload: UpdateApiIntegrationInput,
  ): Promise<ApiIntegrationMetadata>;
  archiveApiIntegration(
    integrationId: string,
    payload?: ApiIntegrationReasonInput,
  ): Promise<ApiIntegrationMetadata>;
  restoreApiIntegration(
    integrationId: string,
    payload?: ApiIntegrationReasonInput,
  ): Promise<ApiIntegrationMetadata>;
  runApiIntegrationMockDemo(
    payload: ApiIntegrationMockRunInput,
  ): Promise<ApiIntegrationMockRunResponse>;
  listApiCallLogs(query?: ListApiCallLogsQuery): Promise<ApiCallLogListResponse>;
  approveFeeReview(
    feeRecordId: string,
    payload?: ApproveFeeReviewInput,
  ): Promise<FeeStateRecord>;
  rejectFeeReview(
    feeRecordId: string,
    payload: RejectFeeReviewInput,
  ): Promise<FeeStateRecord>;
  listFeeReviewHistory(feeRecordId: string): Promise<FeeReviewHistoryEntry[]>;
};

export type ApiClientOptions = {
  allowDemoUserHeader?: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  departmentId: string;
  roleCodes: string[];
  permissionCodes: string[];
  scopedDepartmentIds: string[];
};

export type AuthUserResponse = {
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthClient = {
  me(): Promise<AuthUserResponse>;
  login(payload: LoginRequest): Promise<AuthUserResponse>;
  logout(): Promise<void>;
  requestPasswordReset(payload: PasswordResetRequestInput): Promise<PasswordResetRequestResponse>;
  confirmPasswordReset(payload: PasswordResetConfirmInput): Promise<PasswordResetConfirmResponse>;
  acceptInvite(payload: InviteAcceptInput): Promise<InviteAcceptResponse>;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");
const networkErrorDetail = "无法连接本地服务，请确认服务已启动且当前访问地址被服务允许。";

export const mapApiErrorMessage = (status?: number): Pick<ApiError, "kind" | "message"> => {
  if (status === 401) {
    return {
      kind: "unauthorized",
      message: "请选择或切换业务用户",
    };
  }

  if (status === 403) {
    return {
      kind: "forbidden",
      message: "当前角色无权限",
    };
  }

  if (status === 400) {
    return {
      kind: "bad-request",
      message: "请求参数错误",
    };
  }

  if (status === 404) {
    return {
      kind: "unknown",
      message: "资源不存在",
    };
  }

  if (status === 409) {
    return {
      kind: "unknown",
      message: "数据状态冲突",
    };
  }

  if (status === 422) {
    return {
      kind: "bad-request",
      message: "提交内容不符合业务规则",
    };
  }

  if (status !== undefined && status >= 500) {
    return {
      kind: "server",
      message: "服务不可用",
    };
  }

  return {
    kind: "unknown",
    message: "请求失败",
  };
};

export const createApiClient = (
  demoUserId: string | null,
  options: ApiClientOptions = {},
): AccountManagementApiClient => ({
  async get<T>(path: string, query?: ApiQuery) {
    const response = await request(path, demoUserId, { method: "GET", query }, options);
    return response as T;
  },
  async post<T>(path: string, body?: unknown) {
    const response = await request(path, demoUserId, { method: "POST", body }, options);
    return response as T;
  },
  async postForm<T>(path: string, body: FormData) {
    const response = await requestForm(path, demoUserId, body, options);
    return response as T;
  },
  async put<T>(path: string, body?: unknown) {
    const response = await request(path, demoUserId, { method: "PUT", body }, options);
    return response as T;
  },
  async patch<T>(path: string, body?: unknown) {
    const response = await request(path, demoUserId, { method: "PATCH", body }, options);
    return response as T;
  },
  async downloadBlob(path: string, query?: ApiQuery) {
    return requestBlob(path, demoUserId, query, options);
  },
  async listDepartments(query?: ListDepartmentsQuery) {
    const response = await request(
      "/departments",
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as DepartmentListResponse;
  },
  async getDepartmentTree(query?: ListDepartmentsQuery) {
    const response = await request(
      "/departments/tree",
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as DepartmentTreeResponse;
  },
  async getDepartmentDetail(departmentId: string) {
    const response = await request(
      `/departments/${departmentId}`,
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as DepartmentDetail;
  },
  async createDepartment(payload: CreateDepartmentInput) {
    const response = await request(
      "/departments",
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as DepartmentDetail;
  },
  async updateDepartment(departmentId: string, payload: UpdateDepartmentInput) {
    const response = await request(
      `/departments/${departmentId}`,
      demoUserId,
      { method: "PATCH", body: payload },
      options,
    );
    return response as DepartmentDetail;
  },
  async disableDepartment(departmentId: string, payload: DepartmentReasonInput = {}) {
    const response = await request(
      `/departments/${departmentId}/disable`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as DisableDepartmentResponse;
  },
  async enableDepartment(departmentId: string, payload: DepartmentReasonInput = {}) {
    const response = await request(
      `/departments/${departmentId}/enable`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as DepartmentDetail;
  },
  async dryRunDepartmentImport(input: DepartmentImportDryRunInput) {
    const body = new FormData();
    body.append("file", input.file);
    const response = await requestForm(
      "/imports/departments/dry-run",
      demoUserId,
      body,
      options,
    );
    return response as DepartmentImportDryRunResult;
  },
  async applyDepartmentImport(input: DepartmentImportApplyInput) {
    const body = new FormData();
    body.append("mode", input.mode);
    body.append("file", input.file);
    const response = await requestForm(
      "/imports/departments/apply",
      demoUserId,
      body,
      options,
    );
    return response as DepartmentImportApplyResult;
  },
  async dryRunUserAccountImport(input: UserAccountImportDryRunInput) {
    const body = new FormData();
    body.append("file", input.file);
    const response = await requestForm("/users/import/dry-run", demoUserId, body, options);
    return response as UserAccountImportDryRunResult;
  },
  async applyUserAccountImport(input: UserAccountImportApplyInput) {
    const body = new FormData();
    body.append("mode", input.mode);
    body.append("file", input.file);
    const response = await requestForm("/users/import/apply", demoUserId, body, options);
    return response as UserAccountImportApplyResult;
  },
  async dryRunAchievementImport(input: AchievementImportDryRunInput) {
    const body = new FormData();
    body.append("file", input.file);
    const response = await requestForm(
      "/achievements/import/dry-run",
      demoUserId,
      body,
      options,
    );
    return response as AchievementImportDryRunResult;
  },
  async applyAchievementImport(input: AchievementImportApplyInput) {
    const body = new FormData();
    body.append("mode", input.mode);
    body.append("file", input.file);
    const response = await requestForm(
      "/achievements/import/apply",
      demoUserId,
      body,
      options,
    );
    return response as AchievementImportApplyResult;
  },
  async listImportJobHistory(query?: ImportJobHistoryListQuery) {
    const response = await request(
      "/import-jobs",
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as ImportJobHistoryListResponse;
  },
  async getImportJobHistoryDetail(importJobId: string) {
    const response = await request(
      `/import-jobs/${importJobId}`,
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as ImportJobHistoryDetail;
  },
  async listImportJobHistoryItems(importJobId: string, query?: ImportJobItemHistoryListQuery) {
    const response = await request(
      `/import-jobs/${importJobId}/items`,
      demoUserId,
      { method: "GET", query: buildImportJobItemHistoryQuery(query) },
      options,
    );
    return response as ImportJobItemHistoryListResponse;
  },
  async listCustomReportTemplates() {
    const response = await request(
      "/reports/templates",
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as CustomReportTemplate[];
  },
  async runCustomReport(templateId: string, query?: CustomReportRunQuery) {
    const response = await request(
      `/reports/templates/${encodeURIComponent(templateId)}/run`,
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as CustomReportRunResponse;
  },
  async listAccountUsers(query?: ListAccountUsersQuery) {
    const response = await request(
      "/account-management/users",
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as AccountUserListResponse;
  },
  async getAccountUser(userId: string) {
    const response = await request(
      `/account-management/users/${userId}`,
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as AccountUserDetail;
  },
  async createAccountUser(payload: CreateAccountUserInput) {
    const response = await request(
      "/account-management/users",
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as AccountUserDetail;
  },
  async disableAccountUser(userId: string, payload: DisableAccountUserInput = {}) {
    const response = await request(
      `/account-management/users/${userId}/disable`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as DisableAccountUserResponse;
  },
  async enableAccountUser(userId: string, payload: EnableAccountUserInput = {}) {
    const response = await request(
      `/account-management/users/${userId}/enable`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as AccountUserDetail;
  },
  async assignAccountUserRole(userId: string, payload: AssignAccountUserRoleInput) {
    const response = await request(
      `/account-management/users/${userId}/roles`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as AssignAccountUserRoleResponse;
  },
  async revokeAccountUserRole(
    userId: string,
    userRoleId: string,
    payload: RevokeAccountUserRoleInput = {},
  ) {
    const response = await request(
      `/account-management/users/${userId}/roles/${userRoleId}/revoke`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as AccountUserDetail;
  },
  async changeAccountUserDepartment(
    userId: string,
    payload: ChangeAccountUserDepartmentInput,
  ) {
    const response = await request(
      `/account-management/users/${userId}/department`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as AccountUserDetail;
  },
  async createInvite(payload: CreateInviteInput) {
    const response = await request(
      "/account-management/invites",
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as InviteIssueResponse;
  },
  async resendInvite(userId: string) {
    const response = await request(
      `/account-management/users/${userId}/invite/resend`,
      demoUserId,
      { method: "POST" },
      options,
    );
    return response as InviteIssueResponse;
  },
  async requestAdminPasswordReset(userId: string, payload: { reason?: string | null } = {}) {
    const response = await request(
      `/account-management/users/${userId}/password-reset`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as PasswordResetIssueResponse;
  },
  async revokePasswordResetTokens(userId: string, payload: { reason?: string | null } = {}) {
    const response = await request(
      `/account-management/users/${userId}/password-reset/revoke`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as PasswordResetRevokeResponse;
  },
  async getSecretAuthorizationOverview() {
    const response = await request(
      "/secret-authorization/overview",
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as SecretAuthorizationOverview;
  },
  async listSecretAuthorizationResources() {
    const response = await request(
      "/secret-authorization/resources",
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as SecretAuthorizationResourceList;
  },
  async getSecretAuthorizationResourceGrants(resourceType: string, resourceId: string) {
    const response = await request(
      `/secret-authorization/resources/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/grants`,
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as SecretAuthorizationResourceDetail;
  },
  async listApiIntegrations(query?: ListApiIntegrationsQuery) {
    const response = await request(
      "/settings/api-integrations",
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as ApiIntegrationListResponse;
  },
  async getApiIntegration(integrationId: string) {
    const response = await request(
      `/settings/api-integrations/${integrationId}`,
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as ApiIntegrationMetadata;
  },
  async createApiIntegration(payload: CreateApiIntegrationInput) {
    const response = await request(
      "/settings/api-integrations",
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as ApiIntegrationMetadata;
  },
  async updateApiIntegration(integrationId: string, payload: UpdateApiIntegrationInput) {
    const response = await request(
      `/settings/api-integrations/${integrationId}`,
      demoUserId,
      { method: "PATCH", body: payload },
      options,
    );
    return response as ApiIntegrationMetadata;
  },
  async archiveApiIntegration(integrationId: string, payload: ApiIntegrationReasonInput = {}) {
    const response = await request(
      `/settings/api-integrations/${integrationId}/archive`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as ApiIntegrationMetadata;
  },
  async restoreApiIntegration(integrationId: string, payload: ApiIntegrationReasonInput = {}) {
    const response = await request(
      `/settings/api-integrations/${integrationId}/restore`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as ApiIntegrationMetadata;
  },
  async runApiIntegrationMockDemo(payload: ApiIntegrationMockRunInput) {
    const response = await request(
      "/settings/api-integrations/mock-demo/run",
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as ApiIntegrationMockRunResponse;
  },
  async listApiCallLogs(query?: ListApiCallLogsQuery) {
    const response = await request(
      "/settings/api-integrations/mock-demo/logs",
      demoUserId,
      { method: "GET", query },
      options,
    );
    return response as ApiCallLogListResponse;
  },
  async approveFeeReview(feeRecordId: string, payload: ApproveFeeReviewInput = {}) {
    const response = await request(
      `/fees/${feeRecordId}/review/approve`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as FeeStateRecord;
  },
  async rejectFeeReview(feeRecordId: string, payload: RejectFeeReviewInput) {
    const response = await request(
      `/fees/${feeRecordId}/review/reject`,
      demoUserId,
      { method: "POST", body: payload },
      options,
    );
    return response as FeeStateRecord;
  },
  async listFeeReviewHistory(feeRecordId: string) {
    const response = await request(
      `/fees/${feeRecordId}/review-history`,
      demoUserId,
      { method: "GET" },
      options,
    );
    return response as FeeReviewHistoryEntry[];
  },
});

export const createAuthClient = (): AuthClient => ({
  async me() {
    const response = await request("/auth/me", null, { method: "GET" }, {
      allowDemoUserHeader: false,
    });
    return response as AuthUserResponse;
  },
  async login(payload: LoginRequest) {
    const response = await request("/auth/login", null, { method: "POST", body: payload }, {
      allowDemoUserHeader: false,
    });
    return response as AuthUserResponse;
  },
  async logout() {
    await request("/auth/logout", null, { method: "POST" }, { allowDemoUserHeader: false });
  },
  async requestPasswordReset(payload: PasswordResetRequestInput) {
    const response = await request(
      "/auth/password-reset/request",
      null,
      { method: "POST", body: payload },
      { allowDemoUserHeader: false },
    );
    return response as PasswordResetRequestResponse;
  },
  async confirmPasswordReset(payload: PasswordResetConfirmInput) {
    const response = await request(
      "/auth/password-reset/confirm",
      null,
      { method: "POST", body: payload },
      { allowDemoUserHeader: false },
    );
    return response as PasswordResetConfirmResponse;
  },
  async acceptInvite(payload: InviteAcceptInput) {
    const response = await request(
      "/auth/invites/accept",
      null,
      { method: "POST", body: payload },
      { allowDemoUserHeader: false },
    );
    return response as InviteAcceptResponse;
  },
});

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH";
  query?: ApiQuery;
  body?: unknown;
};

const request = async (
  path: string,
  demoUserId: string | null,
  options: RequestOptions,
  clientOptions: ApiClientOptions = {},
): Promise<unknown> => {
  const url = buildUrl(path, options.query);
  const headers = new Headers();
  const trimmedUserId = demoUserId?.trim();

  if (shouldSendDemoUserHeader(trimmedUserId, clientOptions.allowDemoUserHeader)) {
    headers.set("X-Demo-User-Id", trimmedUserId);
  }

  const init = buildRequestInit(options.method, headers, options.body);

  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw await buildApiError(response);
    }

    if (response.status === 204) {
      return undefined;
    }

    return await response.json();
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    throw {
      kind: "network",
      message: "服务不可用",
      detail: networkErrorDetail,
    } satisfies ApiError;
  }
};

const requestForm = async (
  path: string,
  demoUserId: string | null,
  body: FormData,
  clientOptions: ApiClientOptions = {},
): Promise<unknown> => {
  const url = buildUrl(path);
  const headers = new Headers();
  const trimmedUserId = demoUserId?.trim();

  if (shouldSendDemoUserHeader(trimmedUserId, clientOptions.allowDemoUserHeader)) {
    headers.set("X-Demo-User-Id", trimmedUserId);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body,
    });

    if (!response.ok) {
      throw await buildApiError(response);
    }

    if (response.status === 204) {
      return undefined;
    }

    return await response.json();
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    throw {
      kind: "network",
      message: "服务不可用",
      detail: networkErrorDetail,
    } satisfies ApiError;
  }
};

const requestBlob = async (
  path: string,
  demoUserId: string | null,
  query?: ApiQuery,
  clientOptions: ApiClientOptions = {},
): Promise<Blob> => {
  const url = buildUrl(path, query);
  const headers = new Headers();
  const trimmedUserId = demoUserId?.trim();

  if (shouldSendDemoUserHeader(trimmedUserId, clientOptions.allowDemoUserHeader)) {
    headers.set("X-Demo-User-Id", trimmedUserId);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw await buildApiError(response);
    }

    return await response.blob();
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    throw {
      kind: "network",
      message: "服务不可用",
      detail: networkErrorDetail,
    } satisfies ApiError;
  }
};

export const buildRequestInit = (
  method: "GET" | "POST" | "PUT" | "PATCH",
  headers: Headers,
  body?: unknown,
): RequestInit => {
  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  return init;
};

export const shouldSendDemoUserHeader = (
  demoUserId: string | null | undefined,
  allowDemoUserHeader = !import.meta.env.PROD,
): demoUserId is string => Boolean(allowDemoUserHeader && demoUserId?.trim());

export const serializeQuery = (query?: ApiQuery): string => {
  const searchParams = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => appendQueryValue(searchParams, key, item));
      return;
    }

    appendQueryValue(searchParams, key, value);
  });

  return searchParams.toString();
};

export const buildImportJobItemHistoryQuery = (
  query?: ImportJobItemHistoryListQuery,
): ApiQuery => ({
  status: trimQueryString(query?.status),
  plannedAction: trimQueryString(query?.plannedAction),
  targetType: trimQueryString(query?.targetType),
  safeCode: trimQueryString(query?.safeCode),
  page: query?.page,
  pageSize: query?.pageSize,
});

const trimQueryString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const appendQueryValue = (
  searchParams: URLSearchParams,
  key: string,
  value: ApiQueryValue,
): void => {
  if (value === undefined || value === null || value === "") {
    return;
  }

  searchParams.append(key, String(value));
};

const buildUrl = (path: string, query?: ApiQuery): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${apiBaseUrl}${normalizedPath}`, window.location.origin);
  const serializedQuery = serializeQuery(query);

  if (serializedQuery) {
    url.search = serializedQuery;
  }

  return url.toString();
};

const buildApiError = async (response: Response): Promise<ApiError> => {
  const mapped = mapApiErrorMessage(response.status);
  const body = await readErrorBody(response);

  return {
    ...mapped,
    status: response.status,
    detail: response.status >= 500 ? undefined : readErrorDetail(body),
    body,
  };
};

const readErrorBody = async (response: Response): Promise<unknown> => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
};

const readErrorDetail = (body: unknown): string | undefined => {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;
    return Array.isArray(message) ? message.join("; ") : String(message);
  }

  return undefined;
};

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" &&
  error !== null &&
  "kind" in error &&
  "message" in error;
