import { DepartmentStatus } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { DepartmentManagementModule } from "./department-management.module";
import { DepartmentManagementService } from "./department-management.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  parent: "10000000-0000-4000-8000-000000000010",
};

const now = new Date("2026-06-25T00:00:00.000Z");

type DepartmentManagementServiceMock = {
  listDepartments: ReturnType<typeof vi.fn>;
  listDepartmentTree: ReturnType<typeof vi.fn>;
  getDepartment: ReturnType<typeof vi.fn>;
  createDepartment: ReturnType<typeof vi.fn>;
  updateDepartment: ReturnType<typeof vi.fn>;
  disableDepartment: ReturnType<typeof vi.fn>;
  enableDepartment: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: DepartmentManagementServiceMock,
  identityAdapter: { loadUserContext: ReturnType<typeof vi.fn> },
) => Promise<void>;

const makeUserContext = (permissions: readonly PermissionCode[]): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: permissions.includes(PermissionCode.systemConfig)
    ? [RoleCode.systemAdmin]
    : [RoleCode.researcher],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: permissions.includes(PermissionCode.systemConfig)
        ? RoleCode.systemAdmin
        : RoleCode.researcher,
      scopeType: permissions.includes(PermissionCode.systemConfig)
        ? ScopeType.global
        : ScopeType.department,
      scopeKey: permissions.includes(PermissionCode.systemConfig)
        ? "GLOBAL"
        : ids.department,
      departmentId: permissions.includes(PermissionCode.systemConfig)
        ? null
        : ids.department,
    },
  ],
  scopedDepartmentIds: [ids.department],
});

const makeDepartment = () => ({
  id: ids.department,
  code: "AI_RESEARCH",
  name: "AI Research",
  parentId: ids.parent,
  status: DepartmentStatus.ACTIVE,
  createdAt: now,
  updatedAt: now,
  archivedAt: null,
});

const createServiceMock = (): DepartmentManagementServiceMock => ({
  listDepartments: vi.fn().mockResolvedValue({
    items: [makeDepartment()],
    total: 1,
    page: 1,
    pageSize: 20,
  }),
  listDepartmentTree: vi.fn().mockResolvedValue({
    items: [{ ...makeDepartment(), children: [] }],
  }),
  getDepartment: vi.fn().mockResolvedValue(makeDepartment()),
  createDepartment: vi.fn().mockResolvedValue(makeDepartment()),
  updateDepartment: vi.fn().mockResolvedValue({ ...makeDepartment(), name: "Updated" }),
  disableDepartment: vi.fn().mockResolvedValue({
    department: { ...makeDepartment(), status: DepartmentStatus.ARCHIVED, archivedAt: now },
    impactSummary: {
      activeUsersCount: 0,
      activeUserRoleScopesCount: 0,
      pendingWorkflowTasksCount: 0,
      activeOrUnarchivedAchievementsCount: 2,
      feeRecordsCount: 3,
    },
  }),
  enableDepartment: vi.fn().mockResolvedValue(makeDepartment()),
});

describe("DepartmentManagementController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      await request(app.getHttpServer() as Server).get("/departments").expect(401);
      await request(app.getHttpServer() as Server)
        .post(`/departments/${ids.department}/disable`)
        .send({ reason: "inactive" })
        .expect(401);

      expect(service.listDepartments).not.toHaveBeenCalled();
      expect(service.disableDepartment).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when system config permission is missing", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/departments")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post("/departments")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "NEW_DEPT", name: "New Department" })
        .expect(403);

      expect(service.listDepartments).not.toHaveBeenCalled();
      expect(service.createDepartment).not.toHaveBeenCalled();
    });
  });

  it("lets admin list, tree, and read departments", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/departments")
        .set("X-Demo-User-Id", ids.user)
        .query({
          keyword: "research",
          status: DepartmentStatus.ACTIVE,
          parentId: ids.parent,
          includeArchived: "false",
          page: "1",
          pageSize: "20",
        })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .get("/departments/tree")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      await request(app.getHttpServer() as Server)
        .get(`/departments/${ids.department}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(service.listDepartments).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        expect.objectContaining({ page: 1, pageSize: 20 }),
      );
      expect(service.listDepartmentTree).toHaveBeenCalledOnce();
      expect(service.getDepartment).toHaveBeenCalledWith(expect.any(Object), ids.department);
    });
  });

  it("lets admin create, update, disable, and enable departments", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/departments")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "NEW_DEPT", name: "New Department", parentId: ids.parent })
        .expect(201);

      await request(app.getHttpServer() as Server)
        .patch(`/departments/${ids.department}`)
        .set("X-Demo-User-Id", ids.user)
        .send({ name: "Updated", parentId: null })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post(`/departments/${ids.department}/disable`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "restructure" })
        .expect(201);

      await request(app.getHttpServer() as Server)
        .post(`/departments/${ids.department}/enable`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "restored" })
        .expect(201);

      expect(service.createDepartment).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ code: "NEW_DEPT" }),
      );
      expect(service.updateDepartment).toHaveBeenCalledWith(
        expect.any(Object),
        ids.department,
        expect.objectContaining({ name: "Updated" }),
      );
      expect(service.disableDepartment).toHaveBeenCalledWith(
        expect.any(Object),
        ids.department,
        { reason: "restructure" },
      );
      expect(service.enableDepartment).toHaveBeenCalledWith(
        expect.any(Object),
        ids.department,
        { reason: "restored" },
      );
    });
  });

  it("rejects invalid params, query, and body payloads", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/departments/not-a-uuid")
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/departments")
        .set("X-Demo-User-Id", ids.user)
        .query({ pageSize: "101" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/departments")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "bad-code", name: "Bad Code" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .patch(`/departments/${ids.department}`)
        .set("X-Demo-User-Id", ids.user)
        .send({ status: DepartmentStatus.ARCHIVED })
        .expect(400);

      expect(service.getDepartment).not.toHaveBeenCalled();
      expect(service.listDepartments).not.toHaveBeenCalled();
      expect(service.createDepartment).not.toHaveBeenCalled();
      expect(service.updateDepartment).not.toHaveBeenCalled();
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const previousNodeEnv = process.env.NODE_ENV;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  process.env.NODE_ENV = "test";

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [DepartmentManagementModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(DepartmentManagementService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
  } finally {
    if (app) {
      await app.close();
    }

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
};
