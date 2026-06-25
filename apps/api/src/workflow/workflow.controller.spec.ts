import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { AchievementStatusCode } from "../achievements/domain/achievement-domain.types";
import {
  ActiveWorkflowInstanceAlreadyExistsError,
  DepartmentReviewerNotFoundError,
  InvalidWorkflowInstanceTransitionError,
  InvalidWorkflowTaskTransitionError,
  WorkflowAccessDeniedError,
  WorkflowInstanceTransitionConflictError,
  WorkflowInvalidPayloadError,
  WorkflowInvalidStateError,
  WorkflowTaskTransitionConflictError,
} from "./domain/workflow-errors";
import {
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "./domain/workflow-domain.types";
import { WorkflowModule } from "./workflow.module";
import { WorkflowService } from "./workflow.service";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  instance: "50000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  task: "60000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const researcherPermissionProfile = [
  PermissionCode.achievementCreate,
  PermissionCode.achievementReadOwn,
  PermissionCode.achievementUpdateOwn,
  PermissionCode.achievementSubmit,
] as const;

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

const makeWorkflowResult = (
  taskStatus: WorkflowTaskStatusCode = WorkflowTaskStatusCode.approved,
  achievementStatus: AchievementStatusCode = AchievementStatusCode.pendingArchive,
) => ({
  task: {
    id: ids.task,
    instanceId: ids.instance,
    assigneeId: ids.user,
    stepCode: WorkflowStepCode.departmentReview,
    status: taskStatus,
    createdAt: now,
    updatedAt: now,
    claimedAt: null,
    completedAt: now,
  },
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

const makeWorkflowTaskWithInstance = (
  taskStatus: WorkflowTaskStatusCode = WorkflowTaskStatusCode.pending,
) => ({
  id: ids.task,
  instanceId: ids.instance,
  assigneeId: ids.user,
  stepCode: WorkflowStepCode.departmentReview,
  status: taskStatus,
  createdAt: now,
  updatedAt: now,
  claimedAt: null,
  completedAt: null,
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

const createServiceMock = (): WorkflowServiceMock => ({
  listMyWorkflowTasks: vi.fn().mockResolvedValue({
    items: [makeWorkflowTaskWithInstance()],
  }),
  getMyWorkflowTask: vi.fn().mockResolvedValue(makeWorkflowTaskWithInstance()),
  approveDepartmentReviewTask: vi.fn().mockResolvedValue(makeWorkflowResult()),
  rejectDepartmentReviewTask: vi
    .fn()
    .mockResolvedValue(
      makeWorkflowResult(
        WorkflowTaskStatusCode.rejected,
        AchievementStatusCode.departmentRejected,
      ),
    ),
});

describe("WorkflowController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp([], async (app, service, getFindFirstCallCount) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/workflow/tasks/${ids.task}/approve`)
        .send({})
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.approveDepartmentReviewTask).not.toHaveBeenCalled();
      expect(getFindFirstCallCount()).toBe(0);
    });
  });

  it("returns 403 when achievement:review_department is missing", async () => {
    await withTestApp([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/workflow/tasks/${ids.task}/approve`)
        .set("X-Demo-User-Id", ids.user)
        .send({})
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.approveDepartmentReviewTask).not.toHaveBeenCalled();
    });
  });

  it("lists the current user's workflow tasks", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/workflow/tasks/my")
          .query({
            status: WorkflowTaskStatusCode.approved,
            achievementId: ids.achievement,
          })
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0]).toEqual(
          expect.objectContaining({
            id: ids.task,
            instanceId: ids.instance,
            assigneeId: ids.user,
            status: WorkflowTaskStatusCode.pending,
            instance: expect.objectContaining({
              id: ids.instance,
              targetType: WorkflowTargetTypeCode.achievement,
              targetId: ids.achievement,
            }),
          }),
        );
        expect(response.body.items[0].instance.actions).toBeUndefined();
        expect(response.body.items[0].instance.achievement).toBeUndefined();
        expect(service.listMyWorkflowTasks).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          expect.objectContaining({
            status: WorkflowTaskStatusCode.approved,
            achievementId: ids.achievement,
          }),
        );
      },
    );
  });

  it("rejects invalid workflow task list query with 400", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .get("/workflow/tasks/my")
          .query({ status: "NOT_A_STATUS" })
          .set("X-Demo-User-Id", ids.user)
          .expect(400);

        expect(service.listMyWorkflowTasks).not.toHaveBeenCalled();
      },
    );
  });

  it("gets a current user's workflow task detail", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .get(`/workflow/tasks/${ids.task}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            id: ids.task,
            instanceId: ids.instance,
            assigneeId: ids.user,
            instance: expect.objectContaining({
              targetType: WorkflowTargetTypeCode.achievement,
              targetId: ids.achievement,
            }),
          }),
        );
        expect(response.body.instance.actions).toBeUndefined();
        expect(response.body.instance.achievement).toBeUndefined();
        expect(service.getMyWorkflowTask).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.task,
        );
      },
    );
  });

  it("rejects invalid workflow task detail ids with 400", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .get("/workflow/tasks/not-a-uuid")
          .set("X-Demo-User-Id", ids.user)
          .expect(400);

        expect(service.getMyWorkflowTask).not.toHaveBeenCalled();
      },
    );
  });

  it("approves a department review task", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post(`/workflow/tasks/${ids.task}/approve`)
          .set("X-Demo-User-Id", ids.user)
          .send({ comment: " Approved " })
          .expect(200);

        expect(response.body.task.status).toBe(WorkflowTaskStatusCode.approved);
        expect(service.approveDepartmentReviewTask).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.task,
          expect.objectContaining({ comment: " Approved " }),
        );
      },
    );
  });

  it("rejects invalid approve DTO payloads with 400", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post(`/workflow/tasks/${ids.task}/approve`)
          .set("X-Demo-User-Id", ids.user)
          .send({ comment: "" })
          .expect(400);

        expect(service.approveDepartmentReviewTask).not.toHaveBeenCalled();
      },
    );
  });

  it("rejects a department review task", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post(`/workflow/tasks/${ids.task}/reject`)
          .set("X-Demo-User-Id", ids.user)
          .send({ comment: " Needs revision " })
          .expect(200);

        expect(response.body.task.status).toBe(WorkflowTaskStatusCode.rejected);
        expect(service.rejectDepartmentReviewTask).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.task,
          expect.objectContaining({ comment: " Needs revision " }),
        );
      },
    );
  });

  it("rejects researcher access to department review workflow operations", async () => {
    await withTestApp(researcherPermissionProfile, async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/workflow/tasks/my")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      await request(app.getHttpServer() as Server)
        .get(`/workflow/tasks/${ids.task}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/workflow/tasks/${ids.task}/approve`)
        .set("X-Demo-User-Id", ids.user)
        .send({ comment: "Should be forbidden." })
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post(`/workflow/tasks/${ids.task}/reject`)
        .set("X-Demo-User-Id", ids.user)
        .send({ comment: "Should be forbidden." })
        .expect(403);

      expect(service.listMyWorkflowTasks).not.toHaveBeenCalled();
      expect(service.getMyWorkflowTask).not.toHaveBeenCalled();
      expect(service.approveDepartmentReviewTask).not.toHaveBeenCalled();
      expect(service.rejectDepartmentReviewTask).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid reject DTO payloads with 400", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post(`/workflow/tasks/${ids.task}/reject`)
          .set("X-Demo-User-Id", ids.user)
          .send({})
          .expect(400);

        expect(service.rejectDepartmentReviewTask).not.toHaveBeenCalled();
      },
    );
  });

  it("maps workflow service errors to HTTP status codes", async () => {
    await withTestApp(
      [PermissionCode.achievementReviewDepartment],
      async (app, service) => {
        const cases = [
          {
            error: new WorkflowAccessDeniedError("Workflow task access is denied."),
            expectedStatus: 403,
          },
          {
            error: new WorkflowInvalidStateError("Workflow task is not pending."),
            expectedStatus: 409,
          },
          {
            error: new WorkflowInvalidPayloadError("Reject comment is required."),
            expectedStatus: 422,
          },
          {
            error: new InvalidWorkflowTaskTransitionError(
              WorkflowTaskStatusCode.approved,
              WorkflowTaskStatusCode.rejected,
            ),
            expectedStatus: 409,
          },
          {
            error: new InvalidWorkflowInstanceTransitionError(
              WorkflowInstanceStatusCode.completed,
              WorkflowInstanceStatusCode.active,
            ),
            expectedStatus: 409,
          },
          {
            error: new WorkflowTaskTransitionConflictError(
              ids.task,
              WorkflowTaskStatusCode.pending,
            ),
            expectedStatus: 409,
          },
          {
            error: new WorkflowInstanceTransitionConflictError(
              ids.instance,
              WorkflowInstanceStatusCode.active,
            ),
            expectedStatus: 409,
          },
          {
            error: new ActiveWorkflowInstanceAlreadyExistsError(ids.achievement),
            expectedStatus: 409,
          },
          {
            error: new DepartmentReviewerNotFoundError(ids.department),
            expectedStatus: 422,
          },
        ];

        for (const testCase of cases) {
          service.rejectDepartmentReviewTask.mockRejectedValueOnce(testCase.error);

          await request(app.getHttpServer() as Server)
            .post(`/workflow/tasks/${ids.task}/reject`)
            .set("X-Demo-User-Id", ids.user)
            .send({ comment: "Needs revision." })
            .expect(testCase.expectedStatus);
        }
      },
    );
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[],
  callback: TestCallback,
): Promise<void> => {
  let findFirstCallCount = 0;
  let app: INestApplication | null = null;
  const previousNodeEnv = process.env.NODE_ENV;
  const service = createServiceMock();

  process.env.NODE_ENV = "test";

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [WorkflowModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: async (): Promise<LoadedUserFixture | null> => {
            findFirstCallCount += 1;
            return makeLoadedUser(permissions);
          },
        },
      })
      .overrideProvider(WorkflowService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, () => findFirstCallCount);
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
