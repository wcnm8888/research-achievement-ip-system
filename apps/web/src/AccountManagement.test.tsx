import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, AuthUser } from "./api-client";
import {
  AccountManagement,
  AccountLifecycleProjectionSummary,
  AccountLoginEligibilityInline,
  applyUserAccountImport,
  buildActiveDepartmentOptions,
  buildAssignRolePayload,
  buildChangeDepartmentPayload,
  buildCreateAccountUserPayload,
  buildCreateInvitePayload,
  buildAccountUserListQuery,
  buildUserAccountImportFileFingerprint,
  buildReasonPayload,
  createAccountUserFromForm,
  createInviteFromForm,
  dryRunUserAccountImport,
  executeAccountOperation,
  fetchActiveDepartments,
  fetchAccountUserDetail,
  fetchAccountUsers,
  getDepartmentSelectorErrorDescription,
  getUserAccountImportApplyEligibility,
  hasAccountInvitePermission,
  hasAccountResetPasswordPermission,
  hasSystemConfigPermission,
  mapUserAccountImportApplyErrorToDisplay,
  shouldLoadAccountDepartmentOptions,
  userAccountImportHistoryFilters,
  UserAccountImportApplyConfirmContent,
  UserAccountImportDryRunPanel,
  UserAccountImportDryRunResultView,
  validateUserAccountImportCsvFile,
} from "./AccountManagement";
import type {
  AccountUserDetail,
  AccountUserListResponse,
  AssignAccountUserRoleResponse,
  DepartmentSummary,
  DisableAccountUserResponse,
  UserAccountImportApplyResult,
  UserAccountImportDryRunResult,
} from "./types";

const adminUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["system:config", "account:invite", "account:reset_password", "audit:read"],
};

const accountUser: AccountUserDetail = {
  id: "40000000-0000-4000-8000-000000000011",
  email: "researcher@example.com",
  name: "Researcher",
  status: "ACTIVE",
  department: {
    id: "10000000-0000-4000-8000-000000000001",
    code: "D001",
    name: "Research Department",
    status: "ACTIVE",
  },
  roles: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      role: {
        id: "30000000-0000-4000-8000-000000000001",
        code: "RESEARCHER",
        name: "Researcher",
        status: "ACTIVE",
      },
      scopeType: "DEPARTMENT",
      scopeKey: "10000000-0000-4000-8000-000000000001",
      departmentId: "10000000-0000-4000-8000-000000000001",
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ],
  credential: {
    status: "ACTIVE",
    passwordUpdatedAt: "2026-06-01T00:00:00.000Z",
    disabledAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  lastLogin: null,
  recentLifecycleDelivery: {
    purpose: "INVITE_ACCEPT",
    tokenStatus: "ACTIVE",
    deliveryChannel: "EMAIL",
    deliveryStatus: "QUEUED",
    deliveryAdapter: "LOCAL_SAFE_STUB",
    failureCategory: null,
    maskedEmail: "r***@example.com",
    expiresAt: "2026-06-08T00:00:00.000Z",
    usedAt: null,
    revokedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  loginEligibility: {
    canLogin: true,
    reasonCode: "ACTIVE_CREDENTIAL",
    reasonLabel: "User and credential are active.",
    blockingFactors: [],
  },
  lifecycleActionSummary: {
    latestActionAt: "2026-06-01T00:00:00.000Z",
    disabledCount: 0,
    enabledCount: 0,
    inviteCreatedCount: 1,
    inviteResentCount: 0,
    resetRequestedCount: 0,
    resetRevokedCount: 0,
    latestDeliveryStatus: "QUEUED",
    latestDeliveryAdapter: "LOCAL_SAFE_STUB",
    caveats: ["AUDIT_SUMMARY_DERIVED_FROM_SAFE_OPERATION_CODES"],
  },
  roleChangeAuditSummary: {
    latestRoleChangeAt: null,
    assignedCount: 0,
    revokedCount: 0,
    recentRoleChanges: [],
  },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const activeDepartment: DepartmentSummary = {
  id: "10000000-0000-4000-8000-000000000001",
  code: "D001",
  name: "Research Department",
  parentId: null,
  status: "ACTIVE",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  archivedAt: null,
};

const archivedDepartment: DepartmentSummary = {
  id: "10000000-0000-4000-8000-000000000099",
  code: "OLD",
  name: "Archived Department",
  parentId: null,
  status: "ARCHIVED",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  archivedAt: "2026-06-02T00:00:00.000Z",
};

const userAccountImportDryRunResult: UserAccountImportDryRunResult = {
  importType: "USER_ACCOUNT",
  dryRun: true,
  file: {
    name: "users.csv",
    size: 160,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  columns: {
    required: ["email", "displayName", "departmentCode", "roleCode"],
    optional: ["employeeNo", "scopeType", "scopeDepartmentCode", "status"],
    received: [
      "email",
      "displayName",
      "employeeNo",
      "departmentCode",
      "roleCode",
      "scopeType",
      "scopeDepartmentCode",
      "status",
      "(sensitive)",
    ],
  },
  summary: {
    totalRows: 3,
    validRows: 1,
    errorRows: 1,
    warningRows: 1,
    createCandidates: 1,
    existingUserRows: 1,
    existingEmployeeNoRows: 1,
    existingRoleAssignmentRows: 0,
    reactivationCandidateRows: 1,
    employeeNoDbConflictCheck: "AVAILABLE",
  },
  rows: [
    {
      rowNumber: 2,
      parsed: {
        email: "new.user@example.com",
        displayName: "New User",
        employeeNo: "E001",
        departmentCode: "D001",
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        scopeDepartmentCode: "D001",
        status: "PENDING_ACTIVATION",
        credentialAction: "NO_CREDENTIAL",
      },
      status: "VALID",
      candidateAction: "CREATE_PENDING_USER",
      errors: [],
      warnings: [],
    },
    {
      rowNumber: 3,
      parsed: {
        email: "existing.user@example.com",
        displayName: "Existing User",
        employeeNo: "E002",
        departmentCode: "D001",
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        scopeDepartmentCode: "D001",
        status: "DISABLED",
        credentialAction: "NO_CREDENTIAL",
      },
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING_USER",
      errors: [],
      warnings: [
        {
          field: "email",
          code: "EXISTING_USER",
          message: "User email already exists.",
        },
      ],
    },
    {
      rowNumber: 4,
      parsed: {
        email: "blocked.user@example.com",
        displayName: "Blocked User",
        employeeNo: "E001",
        departmentCode: "UNKNOWN",
        roleCode: "SYSTEM_ADMIN",
        scopeType: "GLOBAL",
        scopeDepartmentCode: null,
        status: "ACTIVE",
        credentialAction: "NO_CREDENTIAL",
      },
      status: "ERROR",
      candidateAction: "SKIP",
      errors: [
        {
          field: "(sensitive)",
          code: "FORBIDDEN_SENSITIVE_COLUMN",
          message: "Sensitive credential, session, and link columns are not supported.",
        },
        {
          field: "departmentCode",
          code: "UNKNOWN_DEPARTMENT",
          message: "Department code does not exist.",
        },
        {
          field: "employeeNo",
          code: "EXISTING_EMPLOYEE_NO",
          message: "employeeNo already belongs to an existing user.",
        },
      ],
      warnings: [
        {
          field: "employeeNo",
          code: "DUPLICATE_IN_FILE",
          message: "employeeNo is duplicated in the uploaded file.",
        },
      ],
    },
  ],
};

const validUserAccountImportDryRunResult: UserAccountImportDryRunResult = {
  ...userAccountImportDryRunResult,
  summary: {
    totalRows: 1,
    validRows: 1,
    errorRows: 0,
    warningRows: 0,
    createCandidates: 1,
    existingUserRows: 0,
    existingEmployeeNoRows: 0,
    existingRoleAssignmentRows: 0,
    reactivationCandidateRows: 0,
    employeeNoDbConflictCheck: "AVAILABLE",
  },
  rows: [userAccountImportDryRunResult.rows[0]!],
};

const userAccountImportApplyResult: UserAccountImportApplyResult = {
  importType: "USER_ACCOUNT",
  dryRun: false,
  mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
  file: validUserAccountImportDryRunResult.file,
  summary: {
    totalRows: 1,
    createdUsersCount: 1,
    createdRolesCount: 1,
    skippedRows: 0,
    failedRows: 0,
    errorCount: 0,
    warningCount: 0,
    auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
  },
  errors: [],
  rows: [
    {
      rowNumber: 2,
      emailMasked: "n***@example.com",
      status: "CREATED",
      createdUserId: "40000000-0000-4000-8000-000000000099",
      createdUserRoleIds: ["50000000-0000-4000-8000-000000000099"],
      roleCode: "RESEARCHER",
      scopeType: "DEPARTMENT",
    },
  ],
};

describe("account management permission helpers", () => {
  it("allows only users with system:config to enter account management", () => {
    expect(hasSystemConfigPermission(adminUser)).toBe(true);
    expect(hasSystemConfigPermission({ permissionCodes: ["audit:read"] })).toBe(false);
    expect(hasSystemConfigPermission(null)).toBe(false);
  });

  it("gates invite and reset affordances with dedicated account lifecycle permissions", () => {
    expect(hasAccountInvitePermission(adminUser)).toBe(true);
    expect(hasAccountResetPasswordPermission(adminUser)).toBe(true);
    expect(hasAccountInvitePermission({ permissionCodes: ["system:config"] })).toBe(false);
    expect(hasAccountResetPasswordPermission({ permissionCodes: ["system:config"] })).toBe(false);
  });

  it("loads department options only inside an authorized account-management context", () => {
    expect(shouldLoadAccountDepartmentOptions(true, "admin-user-id")).toBe(true);
    expect(shouldLoadAccountDepartmentOptions(true, " ")).toBe(false);
    expect(shouldLoadAccountDepartmentOptions(false, "admin-user-id")).toBe(false);
    expect(shouldLoadAccountDepartmentOptions(false, null)).toBe(false);
  });

  it("renders department binding boundary copy without turning account management into Department CRUD", () => {
    const html = renderToStaticMarkup(
      <AccountManagement demoUserId="admin-user-id" authUser={adminUser} />,
    );

    expect(html).toContain("部门选择器只用于账号绑定和角色部门范围绑定");
    expect(html).toContain("不提供部门创建或编辑");
    expect(html).toContain("部门范围仍精确匹配所选部门");
  });

  it("does not request account-management or departments when the user lacks system config", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const html = renderToStaticMarkup(
      <AccountManagement
        demoUserId="auditor-user-id"
        authUser={{ permissionCodes: ["audit:read"] }}
      />,
    );

    expect(html).toContain("当前账号无权访问账号管理");
    expect(html).not.toContain("User account import history");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows the account import dry-run entry only inside the system config account boundary", () => {
    const adminHtml = renderToStaticMarkup(
      <AccountManagement demoUserId="admin-user-id" authUser={adminUser} />,
    );
    const auditorHtml = renderToStaticMarkup(
      <AccountManagement
        demoUserId="auditor-user-id"
        authUser={{ permissionCodes: ["audit:read"] }}
      />,
    );

    expect(adminHtml).toContain("账号导入预检");
    expect(adminHtml).not.toContain("POST /users/import/dry-run");
    expect(adminHtml).toContain("预检会拒绝凭证");
    expect(adminHtml).toContain("账号导入记录");
    expect(userAccountImportHistoryFilters).toEqual({
      family: "USER_ACCOUNT",
      mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    });
    expect(auditorHtml).not.toContain("账号导入预检");
    expect(auditorHtml).not.toContain("/users/import/dry-run");
    expect(auditorHtml).not.toContain("账号导入记录");
  });

  it("renders dedicated lifecycle permission reasons without exposing disabled actions", () => {
    const html = renderToStaticMarkup(
      <AccountManagement
        demoUserId="admin-user-id"
        authUser={{ permissionCodes: ["system:config"] }}
      />,
    );

    expect(html).toContain("缺少账号邀请权限，邀请入口已隐藏");
    expect(html).toContain("缺少密码重置权限，重置入口已隐藏");
    expect(html).not.toContain("Invite user");
  });
});

describe("account management safe lifecycle projections", () => {
  it("renders login eligibility in list/detail friendly form without undefined values", () => {
    const html = renderToStaticMarkup(<AccountLoginEligibilityInline user={accountUser} />);

    expect(html).toContain("Can login");
    expect(html).toContain("ACTIVE_CREDENTIAL");
    expect(html).toContain("User and credential are active.");
    expect(html).toContain("No blocking factors");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("null");
  });

  it("renders lifecycle and role summaries using only safe projection fields", () => {
    const html = renderToStaticMarkup(
      <AccountLifecycleProjectionSummary
        user={{
          ...accountUser,
          lifecycleActionSummary: {
            latestActionAt: "2026-06-02T00:00:00.000Z",
            disabledCount: 1,
            enabledCount: 1,
            inviteCreatedCount: 2,
            inviteResentCount: 1,
            resetRequestedCount: 3,
            resetRevokedCount: 1,
            latestDeliveryStatus: "QUEUED",
            latestDeliveryAdapter: "LOCAL_SAFE_STUB",
            caveats: ["AUDIT_SUMMARY_DERIVED_FROM_SAFE_OPERATION_CODES"],
          },
          roleChangeAuditSummary: {
            latestRoleChangeAt: "2026-06-02T00:00:00.000Z",
            assignedCount: 1,
            revokedCount: 1,
            recentRoleChanges: [
              {
                operation: "USER_ROLE_ASSIGN",
                roleCode: "RESEARCHER",
                scopeType: "DEPARTMENT",
                departmentId: "10000000-0000-4000-8000-000000000001",
                reasonProvided: true,
                createdAt: "2026-06-02T00:00:00.000Z",
              },
            ],
          },
        }}
      />,
    );

    expect(html).toContain("生命周期摘要");
    expect(html).toContain("角色变更摘要");
    expect(html).toContain("分配角色");
    expect(html).toContain("科研人员");
    expect(html).toContain("已填写");
    expect(html).not.toContain("sessionId");
    expect(html).not.toContain("session hash");
    expect(html).not.toContain("cookie");
    expect(html).not.toContain("targetUserId");
    expect(html).not.toContain("passwordHash");
    expect(html).not.toContain("tokenHash");
    expect(html).not.toContain("raw token");
    expect(html).not.toContain("DATABASE_URL");
    expect(html).not.toContain("connection string");
    expect(html).not.toContain(["sec", "ret"].join(""));
    expect(html).not.toContain("raw audit JSON");
    expect(html).not.toContain("debug");
    expect(html).not.toContain("export");
    expect(html).not.toContain("download");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("null");
  });
});

describe("account management active department selector helpers", () => {
  it("requests active departments only and filters archived rows defensively", async () => {
    const client = {
      listDepartments: vi.fn(async () => ({
        items: [activeDepartment, archivedDepartment],
        total: 2,
        page: 1,
        pageSize: 100,
      })),
    } as unknown as Pick<AccountManagementApiClient, "listDepartments">;

    await expect(fetchActiveDepartments(client)).resolves.toEqual([activeDepartment]);
    expect(client.listDepartments).toHaveBeenCalledWith({
      status: "ACTIVE",
      page: 1,
      pageSize: 100,
    });
  });

  it("builds selector options for active departments and omits archived departments", () => {
    expect(buildActiveDepartmentOptions([activeDepartment, archivedDepartment])).toEqual([
      {
        value: activeDepartment.id,
        label: "Research Department / D001",
      },
    ]);
  });

  it("surfaces department loading failures with backend detail when available", () => {
    expect(
      getDepartmentSelectorErrorDescription({
        kind: "unknown",
        status: 409,
        message: "数据状态冲突",
        detail: "Department list unavailable.",
      }),
    ).toBe("Department list unavailable.");
    expect(
      getDepartmentSelectorErrorDescription({
        kind: "network",
        message: "服务不可用",
      }),
    ).toBe("服务不可用");
  });
});

describe("user account import dry-run UI", () => {
  it("validates CSV-only file selection before dry-run submission", () => {
    expect(
      validateUserAccountImportCsvFile({
        name: "users.csv",
        size: 1024,
        type: "text/csv",
      }),
    ).toBeNull();
    expect(
      validateUserAccountImportCsvFile({
        name: "users.xlsx",
        size: 1024,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toContain("仅支持上传 CSV 文件");
    expect(
      validateUserAccountImportCsvFile({
        name: "users.csv",
        size: 1024 * 1024 + 1,
        type: "text/csv",
      }),
    ).toContain("1 MB");
  });

  it("runs user account import dry-run through the client without write helpers", async () => {
    const file = new File(
      ["email,displayName,departmentCode,roleCode\nnew.user@example.com,New User,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv" },
    );
    const client = {
      dryRunUserAccountImport: vi.fn(async () => userAccountImportDryRunResult),
    } as unknown as Pick<AccountManagementApiClient, "dryRunUserAccountImport">;

    await expect(dryRunUserAccountImport(client, file)).resolves.toEqual(
      userAccountImportDryRunResult,
    );
    expect(client.dryRunUserAccountImport).toHaveBeenCalledWith({ file });
  });

  it("runs user account import apply through the client with pending no-credential mode", async () => {
    const file = new File(
      ["email,displayName,departmentCode,roleCode\nnew.user@example.com,New User,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv" },
    );
    const client = {
      applyUserAccountImport: vi.fn(async () => userAccountImportApplyResult),
    } as unknown as Pick<AccountManagementApiClient, "applyUserAccountImport">;

    await expect(applyUserAccountImport(client, file)).resolves.toEqual(
      userAccountImportApplyResult,
    );
    expect(client.applyUserAccountImport).toHaveBeenCalledWith({
      file,
      mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    });
  });

  it("renders summary, safe previews, warnings, and employeeNo DB check status", () => {
    const html = renderToStaticMarkup(
      <UserAccountImportDryRunResultView result={userAccountImportDryRunResult} />,
    );

    expect(html).toContain("预检报告已生成");
    expect(html).toContain("总行数");
    expect(html).toContain("Existing users");
    expect(html).toContain("employeeNo DB conflict check: AVAILABLE");
    expect(html).toContain("Existing employeeNo");
    expect(html).toContain("NO_CREDENTIAL");
    expect(html).toContain("EXISTING_USER");
    expect(html).toContain("EXISTING_EMPLOYEE_NO");
    expect(html).toContain("business identifier");
    expect(html).toContain("DUPLICATE_IN_FILE");
    expect(html).not.toContain("login identity");
  });

  it("renders employeeNo DB conflict check AVAILABLE without exposing matched account details", () => {
    const html = renderToStaticMarkup(
      <UserAccountImportDryRunResultView result={userAccountImportDryRunResult} />,
    );

    expect(html).toContain("employeeNo DB conflict check: AVAILABLE");
    expect(html).toContain("optional business identifier");
    expect(html).toContain("EXISTING_EMPLOYEE_NO");
    expect(html).toContain("this row cannot create a new pending account");
    expect(html).not.toContain("existing.user@example.com matched by employeeNo");
    expect(html).not.toContain("employeeNoNormalized");
  });

  it("renders sensitive column rejection without exposing a sensitive original value", () => {
    const html = renderToStaticMarkup(
      <UserAccountImportDryRunResultView result={userAccountImportDryRunResult} />,
    );

    expect(html).toContain("FORBIDDEN_SENSITIVE_COLUMN");
    expect(html).toContain("(sensitive)");
    expect(html).toContain("Sensitive credential, session, and link columns are not supported.");
    expect(html).not.toContain("temporary-private-value");
    expect(html).not.toContain("https://example.com/reset/");
  });

  it("renders backend dry-run errors as a front-end error state", () => {
    const html = renderToStaticMarkup(
      <UserAccountImportDryRunPanel
        file={new File(["email,displayName"], "users.csv", { type: "text/csv" })}
        loading={false}
        error={{
          kind: "bad-request",
          status: 400,
          message: "CSV validation failed.",
          detail: "Credential and link columns are not supported.",
        }}
        result={null}
        onFileChange={vi.fn()}
        onRunDryRun={vi.fn()}
      />,
    );

    expect(html).toContain("CSV validation failed.");
    expect(html).toContain("Credential and link columns are not supported.");
  });

  it("enables apply only for same-file pending no-credential dry-run results", () => {
    const file = new File(
      ["email,displayName,departmentCode,roleCode\nnew.user@example.com,New User,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv", lastModified: 123 },
    );
    const fingerprint = buildUserAccountImportFileFingerprint(
      file,
      validUserAccountImportDryRunResult,
    );

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: validUserAccountImportDryRunResult,
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({ canApply: true });

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: userAccountImportDryRunResult,
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "请先处理工号等业务标识冲突。",
    });

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: {
          ...validUserAccountImportDryRunResult,
          summary: {
            ...validUserAccountImportDryRunResult.summary,
            errorRows: 1,
            existingEmployeeNoRows: 1,
          },
          rows: [
            {
              ...validUserAccountImportDryRunResult.rows[0]!,
              status: "ERROR",
              candidateAction: "SKIP",
              errors: [
                {
                  field: "employeeNo",
                  code: "EXISTING_EMPLOYEE_NO",
                  message: "employeeNo already belongs to an existing user.",
                },
              ],
            },
          ],
        },
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "请先处理工号等业务标识冲突。",
    });

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: {
          ...validUserAccountImportDryRunResult,
          summary: { ...validUserAccountImportDryRunResult.summary, warningRows: 1 },
        },
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "请先处理预检警告。",
    });

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: {
          ...validUserAccountImportDryRunResult,
          rows: [
            {
              ...validUserAccountImportDryRunResult.rows[0]!,
              candidateAction: "REVIEW_EXISTING_USER",
            },
          ],
        },
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "所有账号导入行都必须是创建待激活账号。",
    });

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: validUserAccountImportDryRunResult,
        mode: "UPSERT",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "当前仅支持创建待激活且无登录凭证的账号。",
    });

    expect(
      getUserAccountImportApplyEligibility({
        file,
        result: validUserAccountImportDryRunResult,
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: true,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "账号导入正在执行，请等待当前操作完成。",
    });
  });

  it("disables stale dry-run apply after the selected file changes", () => {
    const file = new File(
      ["email,displayName,departmentCode,roleCode\nnew.user@example.com,New User,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv", lastModified: 123 },
    );
    const changedFile = new File(
      ["email,displayName,departmentCode,roleCode\nanother.user@example.com,Another,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv", lastModified: 456 },
    );
    const fingerprint = buildUserAccountImportFileFingerprint(
      file,
      validUserAccountImportDryRunResult,
    );

    expect(
      getUserAccountImportApplyEligibility({
        file: changedFile,
        result: validUserAccountImportDryRunResult,
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "已选择的文件发生变化，请重新预检。",
    });
  });

  it("renders disabled pending apply affordance before an eligible dry-run", () => {
    const html = renderToStaticMarkup(
      <UserAccountImportDryRunPanel
        file={null}
        loading={false}
        error={null}
        result={null}
        onFileChange={vi.fn()}
        onRunDryRun={vi.fn()}
      />,
    );

    expect(html).toContain("开始预检");
    expect(html).toContain("创建待激活账号");
    expect(html).toContain("暂不能创建待激活账号");
    expect(html).not.toContain("Execute import");
    expect(html).not.toContain("Run import");
    expect(html).not.toContain("Create accounts");
  });

  it("renders enabled apply affordance, confirmation copy, and success result", () => {
    const file = new File(
      ["email,displayName,departmentCode,roleCode\nnew.user@example.com,New User,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv", lastModified: 123 },
    );
    const html = renderToStaticMarkup(
      <UserAccountImportDryRunPanel
        file={file}
        loading={false}
        applyEligibility={{
          canApply: true,
          reason: "可以创建待激活且无本地凭证的账号。",
        }}
        applyResult={userAccountImportApplyResult}
        error={null}
        result={validUserAccountImportDryRunResult}
        onFileChange={vi.fn()}
        onRunDryRun={vi.fn()}
        onOpenApplyConfirm={vi.fn()}
        onCloseApplyConfirm={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(html).toContain("创建待激活账号");
    expect(html).toContain("可以创建待激活账号");
    expect(html).toContain("账号导入结果");
    expect(html).toContain("已创建账号");
    expect(html).toContain("已创建角色");
    expect(html).toContain("USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL");
    expect(html).toContain("待激活");
    expect(html).toContain("无拒绝或错误摘要。");

    const confirmHtml = renderToStaticMarkup(
      <UserAccountImportApplyConfirmContent result={validUserAccountImportDryRunResult} />,
    );
    expect(confirmHtml).toContain("确认创建待激活账号");
    expect(confirmHtml).not.toContain("POST /users/import/apply");
    expect(confirmHtml).not.toContain("CREATE_ONLY_PENDING_NO_CREDENTIAL");
    expect(confirmHtml).toContain("待激活");
    expect(confirmHtml).toContain("仅创建部门范围内的用户角色");
    expect(confirmHtml).toContain("不创建登录凭证");
    expect(confirmHtml).toContain("不创建登录凭证、密码、会话");
  });

  it("renders sanitized apply errors for rejected, unauthorized, forbidden, and network cases", () => {
    const rejected = mapUserAccountImportApplyErrorToDisplay({
      kind: "bad-request",
      status: 400,
      message: "Request failed",
      detail: "User account import apply requires pending no-credential rows.",
      body: {
        summary: {
          totalRows: 1,
          createdUsersCount: 0,
          createdRolesCount: 0,
          skippedRows: 1,
          failedRows: 0,
          errorCount: 1,
          warningCount: 1,
        },
        errors: [{ code: "EXISTING_USER" }],
      },
    });
    const unauthorized = mapUserAccountImportApplyErrorToDisplay({
      kind: "unauthorized",
      status: 401,
      message: "raw",
    });
    const forbidden = mapUserAccountImportApplyErrorToDisplay({
      kind: "forbidden",
      status: 403,
      message: "raw",
    });
    const network = mapUserAccountImportApplyErrorToDisplay({
      kind: "network",
      message: "Network request failed.",
    });
    const employeeNoRejected = mapUserAccountImportApplyErrorToDisplay({
      kind: "bad-request",
      status: 400,
      message: "Request failed",
      detail: "raw employee E001 matched existing.user@example.com",
      body: {
        summary: {
          totalRows: 1,
          createdUsersCount: 0,
          createdRolesCount: 0,
          skippedRows: 0,
          failedRows: 1,
          errorCount: 1,
          warningCount: 0,
        },
        errors: [{ code: "EXISTING_EMPLOYEE_NO" }],
      },
    });

    expect(rejected.message).toBe("账号导入被业务规则拒绝");
    expect(rejected.detail).toContain("codes=EXISTING_USER");
    expect(rejected.detail).toContain("createdUsers=0");
    expect(employeeNoRejected.message).toBe("账号导入被业务规则拒绝");
    expect(employeeNoRejected.detail).toContain("codes=EXISTING_EMPLOYEE_NO");
    expect(employeeNoRejected.detail).toContain("business identifier already exists");
    expect(employeeNoRejected.detail).not.toContain("E001");
    expect(employeeNoRejected.detail).not.toContain("existing.user@example.com");
    expect(unauthorized.detail).not.toContain("cookie");
    expect(forbidden.detail).toContain("系统配置权限");
    expect(network.message).toBe("账号导入服务暂不可用");
  });
});

describe("buildAccountUserListQuery", () => {
  it("trims optional filters and preserves pagination", () => {
    expect(
      buildAccountUserListQuery(
        {
          keyword: "  researcher@example.com  ",
          status: "ACTIVE",
          departmentId: "  10000000-0000-4000-8000-000000000001  ",
          roleCode: "RESEARCHER",
        },
        2,
        50,
      ),
    ).toEqual({
      keyword: "researcher@example.com",
      status: "ACTIVE",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roleCode: "RESEARCHER",
      page: 2,
      pageSize: 50,
    });
  });

  it("omits blank optional filters", () => {
    expect(
      buildAccountUserListQuery(
        {
          keyword: "  ",
          departmentId: " ",
        },
        1,
        20,
      ),
    ).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});

describe("account management API helpers", () => {
  it("loads account users through the account management client", async () => {
    const response: AccountUserListResponse = {
      items: [accountUser],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    const client = {
      listAccountUsers: vi.fn(async () => response),
    } as unknown as Pick<AccountManagementApiClient, "listAccountUsers">;
    const query = buildAccountUserListQuery({ roleCode: "RESEARCHER" }, 1, 20);

    await expect(fetchAccountUsers(client, query)).resolves.toEqual(response);
    expect(client.listAccountUsers).toHaveBeenCalledWith(query);
  });

  it("loads a single account user detail without requesting sensitive fields", async () => {
    const client = {
      getAccountUser: vi.fn(async () => accountUser),
    } as unknown as Pick<AccountManagementApiClient, "getAccountUser">;

    await expect(fetchAccountUserDetail(client, accountUser.id)).resolves.toEqual(accountUser);
    expect(client.getAccountUser).toHaveBeenCalledWith(accountUser.id);
  });
});

describe("account management operation payloads", () => {
  it("builds a create user payload without echoing blank initialPassword", () => {
    expect(
      buildCreateAccountUserPayload({
        email: "  new-user@example.com  ",
        name: "  New User  ",
        departmentId: "  10000000-0000-4000-8000-000000000001  ",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: " 10000000-0000-4000-8000-000000000001 ",
          },
          {
            roleCode: "AUDITOR",
            scopeType: "GLOBAL",
            departmentId: " should-be-ignored ",
          },
        ],
        initialPassword: "  ",
      }),
    ).toEqual({
      email: "new-user@example.com",
      name: "New User",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
        {
          roleCode: "AUDITOR",
          scopeType: "GLOBAL",
        },
      ],
    });
  });

  it("keeps create user departmentId from the active department selector payload", () => {
    expect(
      buildCreateAccountUserPayload({
        email: "new-user@example.com",
        name: "New User",
        departmentId: activeDepartment.id,
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: activeDepartment.id,
          },
        ],
      }),
    ).toMatchObject({
      departmentId: activeDepartment.id,
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: activeDepartment.id,
        },
      ],
    });
  });

  it("keeps initialPassword only in the submitted create payload when provided", () => {
    expect(
      buildCreateAccountUserPayload({
        email: "new-user@example.com",
        name: "New User",
        departmentId: "10000000-0000-4000-8000-000000000001",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: "10000000-0000-4000-8000-000000000001",
          },
        ],
        initialPassword: "  very-safe-password  ",
      }).initialPassword,
    ).toBe("very-safe-password");
  });

  it("requires departmentId for department-scoped roles", () => {
    expect(() =>
      buildAssignRolePayload({
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        departmentId: " ",
      }),
    ).toThrow("Department scope requires department id.");

    expect(
      buildAssignRolePayload({
        roleCode: "AUDITOR",
        scopeType: "GLOBAL",
        departmentId: "ignored",
        reason: "  temporary coverage  ",
      }),
    ).toEqual({
      roleCode: "AUDITOR",
      scopeType: "GLOBAL",
      reason: "temporary coverage",
    });
  });

  it("keeps selected departmentId for department-scoped role assignment and omits it for global roles", () => {
    expect(
      buildAssignRolePayload({
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        departmentId: activeDepartment.id,
      }),
    ).toEqual({
      roleCode: "RESEARCHER",
      scopeType: "DEPARTMENT",
      departmentId: activeDepartment.id,
    });

    expect(
      buildAssignRolePayload({
        roleCode: "AUDITOR",
        scopeType: "GLOBAL",
        departmentId: activeDepartment.id,
      }),
    ).toEqual({
      roleCode: "AUDITOR",
      scopeType: "GLOBAL",
    });
  });

  it("trims optional reason and department change payloads", () => {
    expect(buildReasonPayload({ reason: "  policy update  " })).toEqual({
      reason: "policy update",
    });
    expect(buildReasonPayload({ reason: "   " })).toEqual({});
    expect(
      buildChangeDepartmentPayload({
        departmentId: ` ${activeDepartment.id} `,
        reason: " department correction ",
      }),
    ).toEqual({
      departmentId: activeDepartment.id,
      reason: "department correction",
    });
  });
});

describe("account management operation API helpers", () => {
  const disabledResponse: DisableAccountUserResponse = {
    user: {
      ...accountUser,
      status: "DISABLED",
    },
    revokedSessionCount: 2,
  };
  const assignedResponse: AssignAccountUserRoleResponse = {
    user: accountUser,
    userRoleId: "50000000-0000-4000-8000-000000000002",
  };

  it("creates users through createAccountUser", async () => {
    const client = {
      createAccountUser: vi.fn(async () => accountUser),
    } as unknown as Pick<AccountManagementApiClient, "createAccountUser">;

    await expect(
      createAccountUserFromForm(client, {
        email: "new-user@example.com",
        name: "New User",
        departmentId: "10000000-0000-4000-8000-000000000001",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: "10000000-0000-4000-8000-000000000001",
          },
        ],
        initialPassword: "very-safe-password",
      }),
    ).resolves.toEqual(accountUser);
    expect(client.createAccountUser).toHaveBeenCalledWith({
      email: "new-user@example.com",
      name: "New User",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
      ],
      initialPassword: "very-safe-password",
    });
  });

  it("creates invite payloads without temporary passwords or token material", async () => {
    const createInviteMock = vi.fn(async () => ({
      userId: accountUser.id,
      deliveryStatus: "QUEUED" as const,
    }));
    const client = {
      createInvite: createInviteMock,
    } as unknown as Pick<AccountManagementApiClient, "createInvite">;

    const values = {
      email: " invited@example.com ",
      name: " Invited User ",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER" as const,
          scopeType: "DEPARTMENT" as const,
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
      ],
      reason: " onboarding ",
    };

    expect(buildCreateInvitePayload(values)).toEqual({
      email: "invited@example.com",
      name: "Invited User",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
      ],
      reason: "onboarding",
    });
    await expect(createInviteFromForm(client, values)).resolves.toEqual({
      userId: accountUser.id,
      deliveryStatus: "QUEUED",
    });
    const serializedCall = JSON.stringify(createInviteMock.mock.calls);
    expect(serializedCall).not.toContain("initialPassword");
    expect(serializedCall).not.toContain("token");
    expect(serializedCall).not.toContain("link");
  });

  it("executes disable, enable, role, revoke, and department operations through API client methods", async () => {
    const accountUserRole = accountUser.roles[0];

    if (!accountUserRole) {
      throw new Error("Account user fixture must include at least one role.");
    }

    const client = {
      getAccountUser: vi.fn(async () => accountUser),
      disableAccountUser: vi.fn(async () => disabledResponse),
      enableAccountUser: vi.fn(async () => accountUser),
      assignAccountUserRole: vi.fn(async () => assignedResponse),
      revokeAccountUserRole: vi.fn(async () => accountUser),
      changeAccountUserDepartment: vi.fn(async () => accountUser),
      resendInvite: vi.fn(async () => ({
        userId: accountUser.id,
        deliveryStatus: "QUEUED" as const,
      })),
      requestAdminPasswordReset: vi.fn(async () => ({
        userId: accountUser.id,
        deliveryStatus: "QUEUED" as const,
      })),
      revokePasswordResetTokens: vi.fn(async () => ({
        revokedTokenCount: 1,
      })),
    } as unknown as Pick<
      AccountManagementApiClient,
      | "disableAccountUser"
      | "getAccountUser"
      | "enableAccountUser"
      | "assignAccountUserRole"
      | "revokeAccountUserRole"
      | "changeAccountUserDepartment"
      | "resendInvite"
      | "requestAdminPasswordReset"
      | "revokePasswordResetTokens"
    >;

    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "disable", user: accountUser },
      reasonValues: { reason: " offboarding " },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "enable", user: { ...accountUser, status: "DISABLED" } },
      reasonValues: { reason: " restored " },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "assign-role", user: accountUser },
      assignRoleValues: {
        roleCode: "AUDITOR",
        scopeType: "GLOBAL",
      },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: {
        kind: "revoke-role",
        user: accountUser,
        userRole: accountUserRole,
      },
      reasonValues: { reason: "scope change" },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "change-department", user: accountUser },
      departmentValues: {
        departmentId: "10000000-0000-4000-8000-000000000002",
        reason: "transfer",
      },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "resend-invite", user: { ...accountUser, status: "PENDING_ACTIVATION" } },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "admin-password-reset", user: accountUser },
      reasonValues: { reason: " reset requested " },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "revoke-password-reset", user: accountUser },
      reasonValues: { reason: " revoke stale links " },
    });

    expect(client.disableAccountUser).toHaveBeenCalledWith(accountUser.id, {
      reason: "offboarding",
    });
    expect(client.enableAccountUser).toHaveBeenCalledWith(accountUser.id, {
      reason: "restored",
    });
    expect(client.assignAccountUserRole).toHaveBeenCalledWith(accountUser.id, {
      roleCode: "AUDITOR",
      scopeType: "GLOBAL",
    });
    expect(client.revokeAccountUserRole).toHaveBeenCalledWith(
      accountUser.id,
      accountUserRole.id,
      { reason: "scope change" },
    );
    expect(client.changeAccountUserDepartment).toHaveBeenCalledWith(accountUser.id, {
      departmentId: "10000000-0000-4000-8000-000000000002",
      reason: "transfer",
    });
    expect(client.resendInvite).toHaveBeenCalledWith(accountUser.id);
    expect(client.requestAdminPasswordReset).toHaveBeenCalledWith(accountUser.id, {
      reason: "reset requested",
    });
    expect(client.revokePasswordResetTokens).toHaveBeenCalledWith(accountUser.id, {
      reason: "revoke stale links",
    });
    expect(client.getAccountUser).toHaveBeenCalledTimes(3);
  });
});
