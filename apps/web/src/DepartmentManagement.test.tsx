import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, ApiError, AuthUser } from "./api-client";
import {
  buildCreateDepartmentPayload,
  buildDepartmentListQuery,
  buildDepartmentReasonPayload,
  buildDepartmentTreeQuery,
  buildUpdateDepartmentPayload,
  createDepartmentFromForm,
  DepartmentManagement,
  executeDepartmentOperation,
  fetchDepartmentDetail,
  fetchDepartments,
  fetchDepartmentTree,
  updateDepartmentFromForm,
} from "./DepartmentManagement";
import type {
  DepartmentDetail,
  DepartmentImpactSummary,
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

describe("department management permission boundary", () => {
  it("renders a permission boundary and does not request departments without system:config", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const html = renderToStaticMarkup(
      <DepartmentManagement demoUserId="auditor-user-id" authUser={auditorUser} />,
    );

    expect(html).toContain("当前账号无权访问部门维护");
    expect(html).toContain("不会请求 /departments");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("renders the operational page with exact-scope copy for system config users", () => {
    const html = renderToStaticMarkup(
      <DepartmentManagement demoUserId="admin-user-id" authUser={adminUser} />,
    );

    expect(html).toContain("部门维护");
    expect(html).toContain("parentId 只表示组织结构");
    expect(html).toContain("权限 scope 仍是精确 departmentId");
    expect(html).toContain("department-management-page");
    expect(html).toContain("department-filter-bar");
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
