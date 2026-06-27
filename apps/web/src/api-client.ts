import type {
  AccountUserDetail,
  AccountUserListResponse,
  AssignAccountUserRoleInput,
  AssignAccountUserRoleResponse,
  ChangeAccountUserDepartmentInput,
  CreateDepartmentInput,
  CreateAccountUserInput,
  DepartmentDetail,
  DepartmentListResponse,
  DepartmentReasonInput,
  DepartmentTreeResponse,
  DisableAccountUserInput,
  DisableAccountUserResponse,
  DisableDepartmentResponse,
  EnableAccountUserInput,
  ListAccountUsersQuery,
  ListDepartmentsQuery,
  RevokeAccountUserRoleInput,
  UpdateDepartmentInput,
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
  patch<T>(path: string, body?: unknown): Promise<T>;
  downloadBlob?(path: string): Promise<Blob>;
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
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export const mapApiErrorMessage = (status?: number): Pick<ApiError, "kind" | "message"> => {
  if (status === 401) {
    return {
      kind: "unauthorized",
      message: "请选择或切换演示用户",
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
  async patch<T>(path: string, body?: unknown) {
    const response = await request(path, demoUserId, { method: "PATCH", body }, options);
    return response as T;
  },
  async downloadBlob(path: string) {
    return requestBlob(path, demoUserId, options);
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
});

type RequestOptions = {
  method: "GET" | "POST" | "PATCH";
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
      detail: error instanceof Error ? error.message : "Network request failed.",
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
      detail: error instanceof Error ? error.message : "Network request failed.",
    } satisfies ApiError;
  }
};

const requestBlob = async (
  path: string,
  demoUserId: string | null,
  clientOptions: ApiClientOptions = {},
): Promise<Blob> => {
  const url = buildUrl(path);
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
      detail: error instanceof Error ? error.message : "Network request failed.",
    } satisfies ApiError;
  }
};

export const buildRequestInit = (
  method: "GET" | "POST" | "PATCH",
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

  return {
    ...mapped,
    status: response.status,
    detail: await readErrorDetail(response),
  };
};

const readErrorDetail = async (response: Response): Promise<string | undefined> => {
  try {
    const body = (await response.json()) as unknown;

    if (typeof body === "object" && body !== null && "message" in body) {
      const message = (body as { message: unknown }).message;
      return Array.isArray(message) ? message.join("; ") : String(message);
    }

    return undefined;
  } catch {
    return undefined;
  }
};

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" &&
  error !== null &&
  "kind" in error &&
  "message" in error;
