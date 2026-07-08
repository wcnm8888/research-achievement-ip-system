import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
} from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardModule } from "./dashboard.module";
import { DashboardService } from "./dashboard.service";
import {
  DashboardMetricKeyCode,
  DashboardMetricSectionCode,
  DashboardOverviewBucketCode,
  DashboardSummary,
} from "./domain/dashboard-domain.types";
import { DashboardAccessDeniedError } from "./domain/dashboard-errors";

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
    departmentRanking: {
      key: DashboardMetricKeyCode.achievementDepartmentRanking,
      section: DashboardMetricSectionCode.achievement,
      value: {
        buckets: [
          {
            departmentId: ids.department,
            departmentCode: "BIO",
            departmentName: "生命科学学院",
            count: 3,
          },
        ],
      },
    },
  },
  citationImpact: {
    summary: {
      key: DashboardMetricKeyCode.citationImpactSummary,
      section: DashboardMetricSectionCode.achievement,
      value: {
        source: "LOCAL_DERIVED",
        externalSourceStatus: "RESERVED_INTERFACE",
        overview: {
          achievementCount: 1,
          citableAchievementCount: 1,
          totalCitations: 59,
          averageCitations: 59,
          hIndex: 1,
        },
        byDepartment: [],
        byResearcher: [],
        topAchievements: [],
        note: "本地引文影响力基于成果台账字段派生；DOI/Crossref/Scopus/OpenAlex 为后续可接入能力。",
      },
    },
  },
  conversion: {
    total: {
      key: DashboardMetricKeyCode.conversionTotal,
      section: DashboardMetricSectionCode.conversion,
      value: { count: 2 },
    },
    totals: {
      key: DashboardMetricKeyCode.conversionAmountSummary,
      section: DashboardMetricSectionCode.conversion,
      value: {
        contractTotal: "100000.00",
        revenueTotal: "60000.00",
      },
    },
    funnel: {
      key: DashboardMetricKeyCode.conversionStatusFunnel,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionStatusCode.signed, count: 1 }],
      },
    },
    byContractStatus: {
      key: DashboardMetricKeyCode.conversionContractStatusDistribution,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionContractStatusCode.active, count: 1 }],
      },
    },
    byRevenueStatus: {
      key: DashboardMetricKeyCode.conversionRevenueStatusDistribution,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionRevenueStatusCode.partial, count: 1 }],
      },
    },
    localRisk: {
      key: DashboardMetricKeyCode.conversionLocalRiskSummary,
      section: DashboardMetricSectionCode.conversion,
      value: {
        overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
      },
    },
    byEvaluationEffect: {
      key: DashboardMetricKeyCode.conversionEvaluationEffectDistribution,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionEvaluationEffectCode.positive, count: 1 }],
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
    risk: {
      key: DashboardMetricKeyCode.feeRiskSummary,
      section: DashboardMetricSectionCode.fee,
      value: {
        overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
        dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
        pending: { key: DashboardOverviewBucketCode.pending, count: 4 },
        paid: { key: PayStatusCode.paid, count: 0 },
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
    efficiency: {
      key: DashboardMetricKeyCode.workflowApprovalEfficiency,
      section: DashboardMetricSectionCode.workflow,
      value: {
        total: { key: DashboardOverviewBucketCode.total, count: 5 },
        pending: { key: WorkflowTaskStatusCode.pending, count: 5 },
        approved: { key: WorkflowTaskStatusCode.approved, count: 0 },
        rejected: { key: WorkflowTaskStatusCode.rejected, count: 0 },
        cancelled: { key: WorkflowTaskStatusCode.cancelled, count: 0 },
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
  integrationMock: {
    recentCalls: {
      key: DashboardMetricKeyCode.integrationMockRecentCalls,
      section: DashboardMetricSectionCode.integrationMock,
      value: { count: 4, windowDays: 7 },
    },
    byStatus: {
      key: DashboardMetricKeyCode.integrationMockStatusDistribution,
      section: DashboardMetricSectionCode.integrationMock,
      value: {
        buckets: [{ key: "SUCCESS", count: 3 }],
      },
    },
    byIntegration: {
      key: DashboardMetricKeyCode.integrationMockByIntegration,
      section: DashboardMetricSectionCode.integrationMock,
      value: {
        buckets: [{ integrationCode: "DOI_PRIMARY", provider: "DOI", count: 3 }],
      },
    },
  },
});

const createServiceMock = (): DashboardServiceMock => ({
  getDashboardSummary: vi.fn().mockResolvedValue(makeDashboardSummary()),
});

describe("DashboardController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.getDashboardSummary).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when user_context:read is missing", async () => {
    await withTestApp([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.getDashboardSummary).not.toHaveBeenCalled();
    });
  });

  it("delegates summary to DashboardService with validated options", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .query({
          today: "2026-06-18",
          dueSoonDays: "7",
        })
        .expect(200);

      expect(response.body.achievement.total.value.count).toBe(3);
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

  it("rejects invalid today and dueSoonDays query values with 400", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
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

  it("preserves count-only Dashboard response shape", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body.achievement.total.value).toEqual({ count: 3 });
      expect(response.body.achievement.departmentRanking.value.buckets).toEqual([
        {
          departmentId: ids.department,
          departmentCode: "BIO",
          departmentName: "生命科学学院",
          count: 3,
        },
      ]);
      expect(response.body.conversion.total.value).toEqual({ count: 2 });
      expect(response.body.conversion.totals.value).toEqual({
        contractTotal: "100000.00",
        revenueTotal: "60000.00",
      });
      expect(response.body.fee.deadline.value.dueSoon).toEqual({
        key: DashboardOverviewBucketCode.dueSoon,
        count: 2,
      });
      expect(response.body.fee.risk.value.pending).toEqual({
        key: DashboardOverviewBucketCode.pending,
        count: 4,
      });
      expect(response.body.workflowTasks.efficiency.value.pending.count).toBe(5);
      expect(response.body.integrationMock.recentCalls.value).toEqual({
        count: 4,
        windowDays: 7,
      });

      const serialized = JSON.stringify(response.body);
      for (const fieldName of [
        "title",
        "identifier",
        "abstract",
        "contributors",
        "amount",
        "voucherNo",
        "comment",
        "content",
        "oldValue",
        "newValue",
        "ipAddress",
        "userAgent",
        "request",
        "response",
        "token",
        "cookie",
        "connectionString",
      ]) {
        expect(serialized).not.toContain(fieldName);
      }
    });
  });

  it("maps DashboardAccessDeniedError to 403", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      service.getDashboardSummary.mockRejectedValueOnce(
        new DashboardAccessDeniedError("Dashboard access denied."),
      );

      const response = await request(app.getHttpServer() as Server)
        .get("/dashboard/summary")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Dashboard access denied.");
    });
  });

  it("uses the identity adapter context at the HTTP boundary", async () => {
    await withTestApp(
      [PermissionCode.userContextRead],
      async (app, service, identityAdapter) => {
        await request(app.getHttpServer() as Server)
          .get("/dashboard/summary")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(identityAdapter.loadUserContext).toHaveBeenCalledWith({
          headers: expect.objectContaining({
            "x-demo-user-id": ids.user,
          }),
        });
        expect(service.getDashboardSummary).toHaveBeenCalledTimes(1);
      },
    );
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
      imports: [DashboardModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(DashboardService)
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
