import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, ApiError, AuthUser } from "./api-client";
import {
  applyDepartmentImport,
  buildDepartmentImportFileFingerprint,
  buildCreateDepartmentPayload,
  buildDepartmentListQuery,
  buildDepartmentReasonPayload,
  buildDepartmentTreeQuery,
  buildUpdateDepartmentPayload,
  createDepartmentFromForm,
  DepartmentImportApplyConfirmContent,
  DepartmentImportDryRunPanel,
  DepartmentImportDryRunResultView,
  DepartmentManagement,
  departmentImportHistoryFilters,
  dryRunDepartmentImport,
  executeDepartmentOperation,
  fetchDepartmentDetail,
  fetchDepartments,
  fetchDepartmentTree,
  getDepartmentImportApplyEligibility,
  mapDepartmentImportApplyErrorToDisplay,
  updateDepartmentFromForm,
  validateDepartmentImportCsvFile,
} from "./DepartmentManagement";
import type {
  DepartmentImportApplyResult,
  DepartmentDetail,
  DepartmentImpactSummary,
  DepartmentImportDryRunResult,
  DepartmentListResponse,
  DepartmentTreeResponse,
} from "./types";

const adminUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["system:config"],
};

const auditorUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["audit:read"],
};

const department: DepartmentDetail = {
  id: "10000000-0000-4000-8000-000000000011",
  code: "RESEARCH_CENTER",
  name: "Research Center",
  parentId: null,
  status: "ACTIVE",
  createdAt: "2026-06-24T00:00:00.000Z",
  updatedAt: "2026-06-24T00:00:00.000Z",
  archivedAt: null,
};

const archivedDepartment: DepartmentDetail = {
  ...department,
  status: "ARCHIVED",
  archivedAt: "2026-06-25T00:00:00.000Z",
};

const impactSummary: DepartmentImpactSummary = {
  activeUsersCount: 0,
  activeUserRoleScopesCount: 0,
  pendingWorkflowTasksCount: 0,
  activeOrUnarchivedAchievementsCount: 2,
  feeRecordsCount: 3,
};

const departmentImportDryRunResult: DepartmentImportDryRunResult = {
  importType: "DEPARTMENT_METADATA",
  dryRun: true,
  file: {
    name: "departments.csv",
    size: 96,
    mimeType: "text/csv",
    encoding: "utf-8",
  },
  columns: {
    required: ["code", "name"],
    optional: ["parentCode"],
    received: ["code", "name", "parentCode"],
  },
  summary: {
    totalRows: 3,
    validRows: 2,
    errorRows: 1,
    warningRows: 1,
    createCandidates: 1,
    existingCodeRows: 1,
  },
  rows: [
    {
      rowNumber: 2,
      parsed: {
        code: "RESEARCH_CENTER",
        name: "Research Center",
        parentCode: null,
      },
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING",
      errors: [],
      warnings: [
        {
          field: "code",
          code: "EXISTING_CODE",
          message: "Department code already exists.",
        },
      ],
    },
    {
      rowNumber: 3,
      parsed: {
        code: "AI_LAB",
        name: "AI Lab",
        parentCode: "MISSING_PARENT",
      },
      status: "ERROR",
      candidateAction: "SKIP",
      errors: [
        {
          field: "parentCode",
          code: "UNKNOWN_PARENT",
          message: "Parent department code was not found.",
        },
      ],
      warnings: [],
    },
  ],
};

const validDepartmentImportDryRunResult: DepartmentImportDryRunResult = {
  ...departmentImportDryRunResult,
  summary: {
    totalRows: 2,
    validRows: 2,
    errorRows: 0,
    warningRows: 0,
    createCandidates: 2,
    existingCodeRows: 0,
  },
  rows: [
    {
      rowNumber: 2,
      parsed: {
        code: "AI_LAB",
        name: "AI Lab",
        parentCode: null,
      },
      status: "VALID",
      candidateAction: "CREATE",
      errors: [],
      warnings: [],
    },
    {
      rowNumber: 3,
      parsed: {
        code: "AI_CHILD",
        name: "AI Child",
        parentCode: "AI_LAB",
      },
      status: "VALID",
      candidateAction: "CREATE",
      errors: [],
      warnings: [],
    },
  ],
};

const departmentImportApplyResult: DepartmentImportApplyResult = {
  importType: "DEPARTMENT_METADATA",
  dryRun: false,
  mode: "CREATE_ONLY",
  file: validDepartmentImportDryRunResult.file,
  summary: {
    totalRows: 2,
    createdRows: 2,
    skippedRows: 0,
    failedRows: 0,
    errorCount: 0,
    warningCount: 0,
  },
  errors: [],
  rows: [
    {
      rowNumber: 2,
      code: "AI_LAB",
      status: "CREATED",
      createdDepartmentId: "10000000-0000-4000-8000-0000000000a1",
    },
  ],
};

describe("department management permission boundary", () => {
  it("renders a permission boundary and does not request departments without system:config", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const html = renderToStaticMarkup(
      <DepartmentManagement demoUserId="auditor-user-id" authUser={auditorUser} />,
    );

    expect(html).toContain("当前账号无权访问部门维护");
    expect(html).toContain("不会请求部门维护服务");
    expect(html).not.toContain("/imports/departments/dry-run");
    expect(html).not.toContain("Department import history");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("renders the operational page with exact-scope copy for system config users", () => {
    const html = renderToStaticMarkup(
      <DepartmentManagement demoUserId="admin-user-id" authUser={adminUser} />,
    );

    expect(html).toContain("部门维护");
    expect(html).toContain("上级部门仅表示组织结构");
    expect(html).toContain("父部门不会自动包含子部门权限");
    expect(html).toContain("department-management-page");
    expect(html).toContain("department-filter-bar");
    expect(html).toContain("部门导入预检");
    expect(html).toContain("上传 CSV 文件后");
    expect(html).toContain("预检通过后，可创建部门");
    expect(html).not.toContain("dryRun=true");
    expect(html).not.toContain("POST /imports/departments/dry-run");
    expect(html).toContain("部门导入记录");
    expect(html).toContain("只读导入记录");
    expect(departmentImportHistoryFilters).toEqual({
      family: "DEPARTMENT",
      mode: "CREATE_ONLY",
    });
  });
});

describe("department management query helpers", () => {
  it("trims list filters and preserves pagination", () => {
    expect(
      buildDepartmentListQuery(
        {
          keyword: "  research  ",
          status: "ACTIVE",
          includeArchived: true,
        },
        2,
        50,
      ),
    ).toEqual({
      keyword: "research",
      status: "ACTIVE",
      includeArchived: true,
      page: 2,
      pageSize: 50,
    });
  });

  it("omits blank tree filters and false includeArchived", () => {
    expect(
      buildDepartmentTreeQuery({
        keyword: " ",
        includeArchived: false,
      }),
    ).toEqual({});
  });
});

describe("department management API helpers", () => {
  it("loads department list, tree, and detail through the department client", async () => {
    const listResponse: DepartmentListResponse = {
      items: [department],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    const treeResponse: DepartmentTreeResponse = {
      items: [{ ...department, children: [] }],
    };
    const client = {
      listDepartments: vi.fn(async () => listResponse),
      getDepartmentTree: vi.fn(async () => treeResponse),
      getDepartmentDetail: vi.fn(async () => department),
    } as unknown as Pick<
      AccountManagementApiClient,
      "listDepartments" | "getDepartmentTree" | "getDepartmentDetail"
    >;

    await expect(fetchDepartments(client, { page: 1, pageSize: 20 })).resolves.toEqual(
      listResponse,
    );
    await expect(fetchDepartmentTree(client, {})).resolves.toEqual(treeResponse);
    await expect(fetchDepartmentDetail(client, department.id)).resolves.toEqual(department);

    expect(client.listDepartments).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(client.getDepartmentTree).toHaveBeenCalledWith({});
    expect(client.getDepartmentDetail).toHaveBeenCalledWith(department.id);
  });

  it("normalizes malformed list and tree responses into stable shapes", async () => {
    const client = {
      listDepartments: vi.fn(async () => ({ items: null, total: null })),
      getDepartmentTree: vi.fn(async () => ({ items: null })),
    } as unknown as Pick<AccountManagementApiClient, "listDepartments" | "getDepartmentTree">;

    await expect(fetchDepartments(client, { page: 3, pageSize: 10 })).resolves.toEqual({
      items: [],
      total: 0,
      page: 3,
      pageSize: 10,
    });
    await expect(fetchDepartmentTree(client, {})).resolves.toEqual({ items: [] });
  });

  it("runs department import dry-run through the department client without write helpers", async () => {
    const file = new File(["code,name\nAI_LAB,AI Lab"], "departments.csv", {
      type: "text/csv",
    });
    const client = {
      dryRunDepartmentImport: vi.fn(async () => departmentImportDryRunResult),
    } as unknown as Pick<AccountManagementApiClient, "dryRunDepartmentImport">;

    await expect(dryRunDepartmentImport(client, file)).resolves.toEqual(
      departmentImportDryRunResult,
    );
    expect(client.dryRunDepartmentImport).toHaveBeenCalledWith({ file });
  });

  it("runs department import apply through the department client with CREATE_ONLY mode", async () => {
    const file = new File(["code,name\nAI_LAB,AI Lab"], "departments.csv", {
      type: "text/csv",
    });
    const client = {
      applyDepartmentImport: vi.fn(async () => departmentImportApplyResult),
    } as unknown as Pick<AccountManagementApiClient, "applyDepartmentImport">;

    await expect(applyDepartmentImport(client, file)).resolves.toEqual(
      departmentImportApplyResult,
    );
    expect(client.applyDepartmentImport).toHaveBeenCalledWith({ file, mode: "CREATE_ONLY" });
  });
});

describe("department import dry-run UI", () => {
  it("validates CSV-only file selection before dry-run submission", () => {
    expect(
      validateDepartmentImportCsvFile({
        name: "departments.csv",
        size: 1024,
        type: "text/csv",
      }),
    ).toBeNull();
    expect(
      validateDepartmentImportCsvFile({
        name: "departments.xlsx",
        size: 1024,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).toContain("仅支持上传 CSV 文件");
    expect(
      validateDepartmentImportCsvFile({
        name: "departments.csv",
        size: 1024 * 1024 + 1,
        type: "text/csv",
      }),
    ).toContain("1 MB");
  });

  it("renders summary, row errors, and warnings from a dry-run result", () => {
    const html = renderToStaticMarkup(
      <DepartmentImportDryRunResultView result={departmentImportDryRunResult} />,
    );

    expect(html).toContain("预检报告已生成");
    expect(html).toContain("总行数");
    expect(html).toContain("3");
    expect(html).toContain("EXISTING_CODE");
    expect(html).toContain("UNKNOWN_PARENT");
    expect(html).toContain("MISSING_PARENT");
  });

  it("renders backend dry-run errors as a front-end error state", () => {
    const html = renderToStaticMarkup(
      <DepartmentImportDryRunPanel
        file={new File(["code,name"], "departments.csv", { type: "text/csv" })}
        loading={false}
        error={{
          kind: "bad-request",
          status: 400,
          message: "CSV validation failed.",
          detail: "Unknown column: ownerEmail.",
        }}
        result={null}
        onFileChange={vi.fn()}
        onRunDryRun={vi.fn()}
      />,
    );

    expect(html).toContain("CSV validation failed.");
    expect(html).toContain("Unknown column: ownerEmail.");
  });

  it("does not render any real import execution entry", () => {
    const html = renderToStaticMarkup(
      <DepartmentImportDryRunPanel
        file={null}
        loading={false}
        error={null}
        result={null}
        onFileChange={vi.fn()}
        onRunDryRun={vi.fn()}
      />,
    );

    expect(html).toContain("开始预检");
    expect(html).not.toContain("Execute import");
    expect(html).not.toContain("Confirm import");
    expect(html).not.toContain("Run import");
    expect(html).not.toContain("确认导入");
    expect(html).not.toContain("执行导入");
  });
  it("enables apply only for same-file CREATE dry-run results without warnings or errors", () => {
    const file = new File(["code,name\nAI_LAB,AI Lab"], "departments.csv", {
      type: "text/csv",
      lastModified: 123,
    });
    const fingerprint = buildDepartmentImportFileFingerprint(
      file,
      validDepartmentImportDryRunResult,
    );

    expect(
      getDepartmentImportApplyEligibility({
        file,
        result: validDepartmentImportDryRunResult,
        mode: "CREATE_ONLY",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({ canApply: true });

    expect(
      getDepartmentImportApplyEligibility({
        file,
        result: departmentImportDryRunResult,
        mode: "CREATE_ONLY",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({ canApply: false, reason: "请先处理预检错误。" });

    expect(
      getDepartmentImportApplyEligibility({
        file,
        result: {
          ...validDepartmentImportDryRunResult,
          summary: { ...validDepartmentImportDryRunResult.summary, warningRows: 1 },
        },
        mode: "CREATE_ONLY",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "请先处理预检警告。",
    });

    expect(
      getDepartmentImportApplyEligibility({
        file,
        result: {
          ...validDepartmentImportDryRunResult,
          rows: [
            {
              ...validDepartmentImportDryRunResult.rows[0]!,
              candidateAction: "REVIEW_EXISTING",
            },
          ],
        },
        mode: "CREATE_ONLY",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({ canApply: false, reason: "所有部门导入行都必须是创建动作。" });

    expect(
      getDepartmentImportApplyEligibility({
        file,
        result: validDepartmentImportDryRunResult,
        mode: "UPSERT",
        submitting: false,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "当前仅支持创建新部门。",
    });

    expect(
      getDepartmentImportApplyEligibility({
        file,
        result: validDepartmentImportDryRunResult,
        mode: "CREATE_ONLY",
        submitting: true,
        fingerprint,
      }),
    ).toMatchObject({
      canApply: false,
      reason: "部门导入正在执行，请等待当前操作完成。",
    });
  });

  it("renders enabled apply affordance, confirmation modal, and success result", () => {
    const file = new File(["code,name\nAI_LAB,AI Lab"], "departments.csv", {
      type: "text/csv",
      lastModified: 123,
    });
    const html = renderToStaticMarkup(
      <DepartmentImportDryRunPanel
        file={file}
        loading={false}
        applyEligibility={{
          canApply: true,
          reason: "Ready for CREATE_ONLY department apply.",
        }}
        applyResult={departmentImportApplyResult}
        error={null}
        result={validDepartmentImportDryRunResult}
        onFileChange={vi.fn()}
        onRunDryRun={vi.fn()}
        onOpenApplyConfirm={vi.fn()}
        onCloseApplyConfirm={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(html).toContain("创建部门");
    expect(html).toContain("可以创建部门");
    expect(html).toContain("部门导入结果");
    expect(html).toContain("已创建行");
    expect(html).toContain("DEPARTMENT_IMPORT_CREATE");
    const confirmHtml = renderToStaticMarkup(
      <DepartmentImportApplyConfirmContent result={validDepartmentImportDryRunResult} />,
    );
    expect(confirmHtml).toContain("确认创建部门信息");
    expect(confirmHtml).toContain("不会更新、合并、删除");
    expect(confirmHtml).toContain("仅创建新部门");
    expect(confirmHtml).not.toContain("POST /imports/departments/apply");
  });

  it("renders sanitized apply errors for rejected, unauthorized, forbidden, and network cases", () => {
    const rejected = mapDepartmentImportApplyErrorToDisplay({
      kind: "bad-request",
      status: 400,
      message: "Request failed",
      detail: "Department import apply requires only CREATE candidates.",
      body: {
        summary: {
          totalRows: 1,
          createdRows: 0,
          skippedRows: 1,
          failedRows: 0,
          errorCount: 1,
          warningCount: 1,
        },
        errors: [{ code: "EXISTING_CODE" }],
      },
    });
    const unauthorized = mapDepartmentImportApplyErrorToDisplay({
      kind: "unauthorized",
      status: 401,
      message: "raw",
    });
    const forbidden = mapDepartmentImportApplyErrorToDisplay({
      kind: "forbidden",
      status: 403,
      message: "raw",
    });
    const network = mapDepartmentImportApplyErrorToDisplay({
      kind: "network",
      message: "Network request failed.",
    });

    expect(rejected.message).toBe("部门导入被业务规则拒绝");
    expect(rejected.detail).toContain("codes=EXISTING_CODE");
    expect(unauthorized.detail).not.toContain("cookie");
    expect(forbidden.detail).toContain("系统配置权限");
    expect(network.message).toBe("部门导入服务暂不可用");
  });
});

describe("department management payload helpers", () => {
  it("builds create payloads with trimmed code/name and nullable parentId", () => {
    expect(
      buildCreateDepartmentPayload({
        code: " RESEARCH_CENTER ",
        name: " Research Center ",
        parentId: " ",
      }),
    ).toEqual({
      code: "RESEARCH_CENTER",
      name: "Research Center",
      parentId: null,
    });
  });

  it("builds update payloads and rejects empty updates", () => {
    expect(
      buildUpdateDepartmentPayload({
        code: " UPDATED_CENTER ",
        name: " Updated Center ",
        parentId: "10000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      code: "UPDATED_CENTER",
      name: "Updated Center",
      parentId: "10000000-0000-4000-8000-000000000001",
    });

    expect(() => buildUpdateDepartmentPayload({})).toThrow(
      "At least one department update field is required.",
    );
  });

  it("trims optional reasons", () => {
    expect(buildDepartmentReasonPayload({ reason: "  merge department  " })).toEqual({
      reason: "merge department",
    });
    expect(buildDepartmentReasonPayload({ reason: "   " })).toEqual({});
  });
});

describe("department management operation helpers", () => {
  it("creates and updates departments through client methods", async () => {
    const client = {
      createDepartment: vi.fn(async () => department),
      updateDepartment: vi.fn(async () => ({ ...department, name: "Updated Center" })),
    } as unknown as Pick<AccountManagementApiClient, "createDepartment" | "updateDepartment">;

    await expect(
      createDepartmentFromForm(client, {
        code: "RESEARCH_CENTER",
        name: "Research Center",
        parentId: null,
      }),
    ).resolves.toEqual(department);
    await expect(
      updateDepartmentFromForm(client, department.id, {
        name: "Updated Center",
      }),
    ).resolves.toMatchObject({ name: "Updated Center" });

    expect(client.createDepartment).toHaveBeenCalledWith({
      code: "RESEARCH_CENTER",
      name: "Research Center",
      parentId: null,
    });
    expect(client.updateDepartment).toHaveBeenCalledWith(department.id, {
      name: "Updated Center",
    });
  });

  it("executes disable and enable with impact summary and refreshable department details", async () => {
    const client = {
      disableDepartment: vi.fn(async () => ({
        department: archivedDepartment,
        impactSummary,
      })),
      enableDepartment: vi.fn(async () => department),
    } as unknown as Pick<AccountManagementApiClient, "disableDepartment" | "enableDepartment">;

    await expect(
      executeDepartmentOperation({
        apiClient: client,
        operation: { kind: "disable", department },
        reasonValues: { reason: " merge " },
      }),
    ).resolves.toEqual({
      kind: "disable",
      department: archivedDepartment,
      impactSummary,
    });
    await expect(
      executeDepartmentOperation({
        apiClient: client,
        operation: { kind: "enable", department: archivedDepartment },
        reasonValues: { reason: " restore " },
      }),
    ).resolves.toEqual({
      kind: "enable",
      department,
    });

    expect(client.disableDepartment).toHaveBeenCalledWith(department.id, {
      reason: "merge",
    });
    expect(client.enableDepartment).toHaveBeenCalledWith(department.id, {
      reason: "restore",
    });
  });

  it("surfaces blocked disable errors without rewriting backend detail", async () => {
    const blockedError: ApiError = {
      kind: "unknown",
      status: 409,
      message: "数据状态冲突",
      detail: "Department has active users, active role scopes, or pending workflow tasks.",
    };
    const client = {
      disableDepartment: vi.fn(async () => {
        throw blockedError;
      }),
      enableDepartment: vi.fn(async () => department),
    } as unknown as Pick<AccountManagementApiClient, "disableDepartment" | "enableDepartment">;

    await expect(
      executeDepartmentOperation({
        apiClient: client,
        operation: { kind: "disable", department },
      }),
    ).rejects.toEqual(blockedError);
  });
});
