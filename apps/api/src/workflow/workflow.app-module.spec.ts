import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AchievementService } from "../achievements/achievement.service";
import { AchievementStatusCode } from "../achievements/domain/achievement-domain.types";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import {
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "./domain/workflow-domain.types";
import { WorkflowService } from "./workflow.service";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  instance: "50000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  task: "60000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type LoadedUserFixture = {
  id: string;
  departmentId: string;
  userRoles: Array<{
    departmentId: string | null;
    scopeKey: string;
    scopeType: ScopeType;
    role: {
      id: string;
      code: RoleCode;
      rolePermissions: Array<{
        permission: {
          code: PermissionCode;
          status: "ACTIVE";
        };
      }>;
    };
  }>;
};

type WorkflowServiceMock = {
  listMyWorkflowTasks: ReturnType<typeof vi.fn>;
  getMyWorkflowTask: ReturnType<typeof vi.fn>;
  approveDepartmentReviewTask: ReturnType<typeof vi.fn>;
  rejectDepartmentReviewTask: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: WorkflowServiceMock,
  getFindFirstCallCount: () => number,
) => Promise<void>;

const now = "2026-01-02T00:00:00.000Z";

const makeWorkflowTaskWithInstance = (
  status: WorkflowTaskStatusCode = WorkflowTaskStatusCode.pending,
) => ({
  id: ids.task,
  instanceId: ids.instance,
  assigneeId: ids.user,
  stepCode: WorkflowStepCode.departmentReview,
  status,
  createdAt: now,
  updatedAt: now,
  claimedAt: null,
  completedAt: status === WorkflowTaskStatusCode.pending ? null : now,
  instance: {
    id: ids.instance,
    targetType: WorkflowTargetTypeCode.achievement,
    targetId: ids.achievement,
    status: WorkflowInstanceStatusCode.active,
    currentStep: WorkflowStepCode.departmentReview,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
  },
});

const makeWorkflowActionResult = (
  status: WorkflowTaskStatusCode = WorkflowTaskStatusCode.approved,
  achievementStatus: AchievementStatusCode = AchievementStatusCode.pendingArchive,
) => ({
  task: makeWorkflowTaskWithInstance(status),
  achievement: {
    id: ids.achievement,
    status: achievementStatus,
    departmentId: ids.department,
    ownerUserId: "40000000-0000-4000-8000-000000000099",
    submittedById: "40000000-0000-4000-8000-000000000099",
    updatedById: ids.user,
    archivedById: null,
    voidedById: null,
    version: 2,
    submittedAt: now,
    archivedAt: null,
    voidedAt: null,
    voidReason: null,
  },
});

const createWorkflowServiceMock = (): WorkflowServiceMock => ({
  listMyWorkflowTasks: vi.fn().mockResolvedValue({
    items: [makeWorkflowTaskWithInstance()],
  }),
  getMyWorkflowTask: vi.fn().mockResolvedValue(makeWorkflowTaskWithInstance()),
  approveDepartmentReviewTask: vi.fn().mockResolvedValue(makeWorkflowActionResult()),
  rejectDepartmentReviewTask: vi
    .fn()
    .mockResolvedValue(
      makeWorkflowActionResult(
        WorkflowTaskStatusCode.rejected,
        AchievementStatusCode.departmentRejected,
      ),
    ),
});

describe("Workflow routes through AppModule", () => {
  it("keeps the health route available after workflow module integration", async () => {
    await withAppModule([], async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body).toEqual({
        service: "research-achievement-ip-api",
        status: "ok",
      });
    });
  });

  it("exposes workflow read and action routes through AppModule", async () => {
    await withAppModule(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .get("/workflow/tasks/my")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .get(`/workflow/tasks/${ids.task}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .post(`/workflow/tasks/${ids.task}/approve`)
          .set("X-Demo-User-Id", ids.user)
          .send({ comment: "Approved." })
          .expect(200);

        await request(app.getHttpServer() as Server)
          .post(`/workflow/tasks/${ids.task}/reject`)
          .set("X-Demo-User-Id", ids.user)
          .send({ comment: "Needs revision." })
          .expect(200);

        expect(service.listMyWorkflowTasks).toHaveBeenCalledOnce();
        expect(service.getMyWorkflowTask).toHaveBeenCalledOnce();
        expect(service.approveDepartmentReviewTask).toHaveBeenCalledOnce();
        expect(service.rejectDepartmentReviewTask).toHaveBeenCalledOnce();
      },
    );
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(
      [PermissionCode.achievementReviewDepartment],
      async (app, service, getFindFirstCallCount) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/workflow/tasks/my")
          .expect(401);

        expect(response.body.message).toBe("User context is required.");
        expect(service.listMyWorkflowTasks).not.toHaveBeenCalled();
        expect(getFindFirstCallCount()).toBe(0);
      },
    );
  });

  it("returns 403 through AppModule when static permission is missing", async () => {
    await withAppModule([], async (app, service, getFindFirstCallCount) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/workflow/tasks/my")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.listMyWorkflowTasks).not.toHaveBeenCalled();
      expect(getFindFirstCallCount()).toBe(1);
    });
  });
});

const withAppModule = async (
  permissions: readonly PermissionCode[],
  callback: TestCallback,
): Promise<void> => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";

  let findFirstCallCount = 0;
  let app: INestApplication | null = null;
  const workflowService = createWorkflowServiceMock();

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WorkflowService)
      .useValue(workflowService)
      .overrideProvider(AchievementService)
      .useValue({})
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: async (): Promise<LoadedUserFixture | null> => {
            findFirstCallCount += 1;
            return makeLoadedUser(permissions);
          },
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, workflowService, () => findFirstCallCount);
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

const makeLoadedUser = (
  permissions: readonly PermissionCode[],
): LoadedUserFixture => ({
  id: ids.user,
  departmentId: ids.department,
  userRoles: [
    {
      departmentId: ids.department,
      scopeKey: ids.department,
      scopeType: ScopeType.department,
      role: {
        id: ids.role,
        code: RoleCode.researchSecretary,
        rolePermissions: permissions.map((permission) => ({
          permission: {
            code: permission,
            status: "ACTIVE",
          },
        })),
      },
    },
  ],
});
