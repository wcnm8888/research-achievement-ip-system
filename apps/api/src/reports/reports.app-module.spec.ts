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
  runTemplate: ReturnType<typeof vi.fn>;
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

const createServiceMock = (): ReportsServiceMock => ({
  listTemplates: vi.fn().mockReturnValue(customReportTemplates),
  runTemplate: vi.fn().mockResolvedValue(makeRunResult()),
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
      expect(service.runTemplate).not.toHaveBeenCalled();
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
