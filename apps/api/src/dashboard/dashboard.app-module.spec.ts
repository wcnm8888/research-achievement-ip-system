import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardService } from "./dashboard.service";
import {
  DashboardMetricKeyCode,
  DashboardMetricSectionCode,
  DashboardOverviewBucketCode,
  DashboardSummary,
} from "./domain/dashboard-domain.types";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type DashboardServiceMock = {
  getDashboardSummary: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: DashboardServiceMock,
  identityAdapter: { loadUserContext: ReturnType<typeof vi.fn> },
) => Promise<void>;

const makeUserContext = (
  permissions: readonly PermissionCode[],
): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.researcher],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
    },
  ],
  scopedDepartmentIds: [ids.department],
});

const makeDashboardSummary = (): DashboardSummary => ({
  generatedAt: new Date("2026-06-18T00:00:00.000Z"),
  scope: {
    userId: ids.user,
    departmentId: ids.department,
  },
  achievement: {
    total: {
      key: DashboardMetricKeyCode.achievementTotal,
      section: DashboardMetricSectionCode.achievement,
      value: { count: 3 },
    },
    byType: {
      key: DashboardMetricKeyCode.achievementTypeDistribution,
      section: DashboardMetricSectionCode.achievement,
      value: {
        buckets: [{ key: AchievementTypeCode.paper, count: 2 }],
      },
    },
    byStatus: {
      key: DashboardMetricKeyCode.achievementStatusDistribution,
      section: DashboardMetricSectionCode.achievement,
      value: {
        buckets: [{ key: AchievementStatusCode.archived, count: 1 }],
      },
    },
  },
  fee: {
    byPayStatus: {
      key: DashboardMetricKeyCode.feePayStatusDistribution,
      section: DashboardMetricSectionCode.fee,
      value: {
        buckets: [{ key: PayStatusCode.pending, count: 4 }],
      },
    },
    deadline: {
      key: DashboardMetricKeyCode.feeDeadlineOverview,
      section: DashboardMetricSectionCode.fee,
      value: {
        overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
        dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
      },
    },
  },
  workflowTasks: {
    byStatus: {
      key: DashboardMetricKeyCode.workflowTaskStatusOverview,
      section: DashboardMetricSectionCode.workflow,
      value: {
        buckets: [{ key: WorkflowTaskStatusCode.pending, count: 5 }],
      },
    },
  },
  reminderTasks: {
    byStatus: {
      key: DashboardMetricKeyCode.reminderTaskStatusOverview,
      section: DashboardMetricSectionCode.reminder,
      value: {
        buckets: [{ key: ReminderStatusCode.sent, count: 2 }],
      },
    },
  },
});

const createServiceMock = (): DashboardServiceMock => ({
  getDashboardSummary: vi.fn().mockResolvedValue(makeDashboardSummary()),
});

describe("Dashboard routes through AppModule", () => {
  it("keeps the health route available after dashboard module integration", async () => {
    await withAppModule(null, async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body).toEqual({
        service: "research-achievement-ip-api",
        status: "ok",
      });
    });
  });

  it("exposes dashboard summary through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .query({
          today: "2026-06-18",
          dueSoonDays: "7",
        })
        .expect(200);

      expect(response.body.achievement.total.value.count).toBe(3);
      expect(service.getDashboardSummary).toHaveBeenCalledOnce();
      expect(service.getDashboardSummary).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        {
          today: new Date("2026-06-18"),
          dueSoonDays: 7,
        },
      );
    });
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(null, async (app, service, identityAdapter) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(identityAdapter.loadUserContext).toHaveBeenCalledOnce();
      expect(service.getDashboardSummary).not.toHaveBeenCalled();
    });
  });

  it("returns 403 through AppModule when user_context:read is missing", async () => {
    await withAppModule([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.getDashboardSummary).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid query values through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .query({ today: "not-a-date" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .query({ dueSoonDays: "0" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .query({ dueSoonDays: "91" })
        .expect(400);

      expect(service.getDashboardSummary).not.toHaveBeenCalled();
    });
  });
});

const withAppModule = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DashboardService)
      .useValue(service)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
  } finally {
    if (app) {
      await app.close();
    }
  }
};
