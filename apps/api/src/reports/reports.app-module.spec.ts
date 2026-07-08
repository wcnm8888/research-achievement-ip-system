import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import {
  CustomReportTemplateIdCode,
  CustomReportRunResult,
  ScheduledReportPlan,
  ScheduledReportEmailResult,
  ScheduledReportPreviewResult,
  customReportTemplates,
} from "./domain/custom-report-domain.types";
import { CustomReportTemplateNotFoundError } from "./domain/custom-report-errors";
import { ReportsService } from "./reports.service";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type ReportsServiceMock = {
  listTemplates: ReturnType<typeof vi.fn>;
  listScheduledPlans: ReturnType<typeof vi.fn>;
  previewScheduledPlan: ReturnType<typeof vi.fn>;
  sendScheduledPlanEmail: ReturnType<typeof vi.fn>;
  runTemplate: ReturnType<typeof vi.fn>;
  exportTemplateCsv: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: ReportsServiceMock,
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

const makeRunResult = (): CustomReportRunResult => ({
  metadata: {
    templateId: CustomReportTemplateIdCode.achievementDistribution,
    name: "部门成果数量与类型分布",
    description: "按部门和成果类型汇总当前可读成果数量。",
    generatedAt: "2026-06-18T00:00:00.000Z",
    localDemoOnly: true,
    notProductionMonitoring: true,
  },
  filters: {
    dateFrom: "2026-01-01",
    dateTo: "2026-12-31",
  },
  scopeSummary: {
    userId: ids.user,
    departmentId: ids.department,
    departmentScope: { departmentIds: [ids.department] },
    policy: "achievement-readable",
  },
  columns: [{ key: "count", label: "Count", type: "number" }],
  rows: [{ count: 3 }],
  totals: { count: 3 },
  caveats: [
    "local/demo/custom report summary",
    "not full BI",
    "not production monitoring",
  ],
});

const makeScheduledPlan = (): ScheduledReportPlan => ({
  planId: "monthly-achievement-distribution",
  name: "科研成果月报",
  cadence: "MONTHLY",
  templateId: CustomReportTemplateIdCode.achievementDistribution,
  recipientScope: "DEPARTMENT_MANAGERS",
  nextPeriodLabel: "下月初",
  channels: ["IN_APP", "EMAIL_RESERVED"],
  inAppDelivery: "LOCAL_PREVIEW",
  emailDelivery: "RESERVED_INTERFACE",
});

const makeScheduledPreview = (): ScheduledReportPreviewResult => ({
  plan: makeScheduledPlan(),
  generatedAt: "2026-06-18T00:00:00.000Z",
  report: makeRunResult(),
  delivery: {
    inApp: {
      status: "LOCAL_PREVIEW_CREATED",
      notificationId: "notification-id",
      title: "科研成果月报生成预演",
      content: "科研成果月报已完成本地生成预演。",
    },
    email: {
      status: "RESERVED_INTERFACE",
      message: "邮件通道预留，当前本地预演不连接真实邮件服务。",
    },
  },
  caveats: ["本地定时报表预演", "站内信为本地摘要", "邮件通道为后续可接入能力"],
});

const makeScheduledEmailResult = (): ScheduledReportEmailResult => ({
  plan: makeScheduledPlan(),
  generatedAt: "2026-06-18T00:00:00.000Z",
  report: makeRunResult(),
  delivery: {
    email: {
      status: "DRY_RUN",
      message: "邮件发送已走到报表推送链路，但当前为 dry-run/本地安全模式，未真实外发。",
      adapter: "ALIYUN_DIRECTMAIL_DRY_RUN",
      recipientCount: 1,
      recipientMasks: ["a***@example.com"],
      dryRun: true,
      attemptCount: 1,
      providerMessageIds: ["dry-run-report"],
    },
  },
  caveats: ["手动邮件推送"],
});

const createServiceMock = (): ReportsServiceMock => ({
  listTemplates: vi.fn().mockReturnValue(customReportTemplates),
  listScheduledPlans: vi.fn().mockReturnValue([makeScheduledPlan()]),
  previewScheduledPlan: vi.fn().mockResolvedValue(makeScheduledPreview()),
  sendScheduledPlanEmail: vi.fn().mockResolvedValue(makeScheduledEmailResult()),
  runTemplate: vi.fn().mockResolvedValue(makeRunResult()),
  exportTemplateCsv: vi.fn().mockResolvedValue("Count\r\n3\r\n"),
});

describe("Reports routes through AppModule", () => {
  it("exposes the custom report template list through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/reports/templates")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body).toHaveLength(5);
      expect(response.body.map((template: { templateId: string }) => template.templateId)).toEqual(
        [
          CustomReportTemplateIdCode.achievementDistribution,
          CustomReportTemplateIdCode.achievementTrend,
          CustomReportTemplateIdCode.feeRiskSummary,
          CustomReportTemplateIdCode.workflowEfficiency,
          CustomReportTemplateIdCode.conversionFunnel,
        ],
      );
      expect(service.listTemplates).toHaveBeenCalledOnce();
    });
  });

  it("exposes scheduled report plans through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/reports/scheduled-plans")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        planId: "monthly-achievement-distribution",
        cadence: "MONTHLY",
        inAppDelivery: "LOCAL_PREVIEW",
        emailDelivery: "RESERVED_INTERFACE",
      });
      expect(service.listScheduledPlans).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({ userId: ids.user }),
      );
    });
  });

  it("previews a scheduled report without external delivery through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/reports/scheduled-plans/monthly-achievement-distribution/preview")
        .set("X-Demo-User-Id", ids.user)
        .expect(201);

      expect(response.body.plan.planId).toBe("monthly-achievement-distribution");
      expect(response.body.delivery.inApp.status).toBe("LOCAL_PREVIEW_CREATED");
      expect(response.body.delivery.email.status).toBe("RESERVED_INTERFACE");
      expect(response.body.delivery.email.message).toContain("邮件通道预留");
      expect(service.previewScheduledPlan).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({ userId: ids.user }),
        "monthly-achievement-distribution",
      );
    });
  });

  it("sends a scheduled report email through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/reports/scheduled-plans/monthly-achievement-distribution/email")
        .set("X-Demo-User-Id", ids.user)
        .expect(201);

      expect(response.body.plan.planId).toBe("monthly-achievement-distribution");
      expect(response.body.delivery.email.status).toBe("DRY_RUN");
      expect(response.body.delivery.email.recipientMasks).toEqual(["a***@example.com"]);
      expect(service.sendScheduledPlanEmail).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({ userId: ids.user }),
        "monthly-achievement-distribution",
      );
    });
  });

  it("runs a custom report template with parsed query parameters", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/reports/templates/achievement-distribution/run")
        .set("X-Demo-User-Id", ids.user)
        .query({
          dateFrom: "2026-01-01",
          dateTo: "2026-12-31",
          departmentId: ids.department,
        })
        .expect(200);

      expect(response.body.metadata.templateId).toBe(
        CustomReportTemplateIdCode.achievementDistribution,
      );
      expect(service.runTemplate).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        CustomReportTemplateIdCode.achievementDistribution,
        {
          dateFrom: new Date("2026-01-01"),
          dateTo: new Date("2026-12-31"),
          departmentId: ids.department,
          achievementType: undefined,
          status: undefined,
          groupBy: undefined,
          dueSoonDays: undefined,
        },
      );
    });
  });

  it("returns 403 through AppModule when user_context:read is missing", async () => {
    await withAppModule([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/reports/templates")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.listTemplates).not.toHaveBeenCalled();
      expect(service.listScheduledPlans).not.toHaveBeenCalled();
      expect(service.previewScheduledPlan).not.toHaveBeenCalled();
      expect(service.sendScheduledPlanEmail).not.toHaveBeenCalled();
      expect(service.runTemplate).not.toHaveBeenCalled();
      expect(service.exportTemplateCsv).not.toHaveBeenCalled();
    });
  });

  it("exports a custom report template as CSV with parsed filters", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/reports/templates/achievement-distribution/export.csv")
        .set("X-Demo-User-Id", ids.user)
        .query({
          dateFrom: "2026-01-01",
          dateTo: "2026-12-31",
          departmentId: ids.department,
        })
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain("custom-report.csv");
      expect(response.text).toBe("Count\r\n3\r\n");
      expect(service.exportTemplateCsv).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        CustomReportTemplateIdCode.achievementDistribution,
        {
          dateFrom: new Date("2026-01-01"),
          dateTo: new Date("2026-12-31"),
          departmentId: ids.department,
          achievementType: undefined,
          status: undefined,
          groupBy: undefined,
          dueSoonDays: undefined,
        },
      );
    });
  });

  it("returns 404 when a custom report template is unknown", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      service.runTemplate.mockRejectedValueOnce(
        new CustomReportTemplateNotFoundError("unknown-template"),
      );

      const response = await request(app.getHttpServer() as Server)
        .get("/reports/templates/unknown-template/run")
        .set("X-Demo-User-Id", ids.user)
        .expect(404);

      expect(response.body.message).toContain("unknown-template");
    });
  });

  it("rejects invalid report query values before service execution", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/reports/templates/achievement-trend/run")
        .set("X-Demo-User-Id", ids.user)
        .query({ dateFrom: "not-a-date" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/reports/templates/achievement-trend/run")
        .set("X-Demo-User-Id", ids.user)
        .query({ groupBy: "week" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/reports/templates/fee-risk-summary/run")
        .set("X-Demo-User-Id", ids.user)
        .query({ dueSoonDays: "0" })
        .expect(400);

      expect(service.runTemplate).not.toHaveBeenCalled();
    });
  });
});

const withAppModule = async (
  permissions: readonly PermissionCode[],
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(makeUserContext(permissions)),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReportsService)
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
