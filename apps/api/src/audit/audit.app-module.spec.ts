import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { AuditService, MaskedAuditListResult } from "./audit.service";
import { AuditActionCode } from "./domain/audit-action-code";
import { AuditTargetTypeCode } from "./domain/audit-target-type-code";

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  auditLog: "90000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  target: "30000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
};

type AuditServiceMock = {
  listMasked: ReturnType<typeof vi.fn>;
  exportMaskedCsv: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: AuditServiceMock,
  identityAdapter: { loadUserContext: ReturnType<typeof vi.fn> },
) => Promise<void>;

const makeUserContext = (
  permissions: readonly PermissionCode[],
): UserContext => ({
  userId: ids.actor,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: RoleCode.systemAdmin,
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
    },
  ],
  scopedDepartmentIds: [ids.department],
});

const makeMaskedAuditResult = (): MaskedAuditListResult => ({
  items: [
    {
      id: ids.auditLog,
      actorUserId: ids.actor,
      actorDepartmentId: ids.department,
      action: AuditActionCode.update,
      targetType: AuditTargetTypeCode.achievement,
      targetId: ids.target,
      targetDepartmentId: ids.department,
      targetSecretLevel: SecretLevelCode.internal,
      traceId: "trace-001",
      createdAt: new Date("2026-06-21T00:00:00.000Z"),
      oldValueMasked: {
        status: "DRAFT",
        token: "[REDACTED_SENSITIVE]",
        cookie: "[REDACTED_SENSITIVE]",
        password: "[REDACTED_SENSITIVE]",
        apiKey: "[REDACTED_SENSITIVE]",
        storageKey: "[REDACTED_SENSITIVE]",
        checksum: "[REDACTED_SENSITIVE]",
        configRef: "[REDACTED_SENSITIVE]",
      },
      newValueMasked: {
        status: "PENDING_DEPARTMENT_REVIEW",
        token: "[REDACTED_SENSITIVE]",
      },
      ipAddressMasked: "[REDACTED_IP]",
      userAgentMasked: "[REDACTED_USER_AGENT]",
    },
  ],
});

const createServiceMock = (): AuditServiceMock => ({
  listMasked: vi.fn().mockResolvedValue(makeMaskedAuditResult()),
  exportMaskedCsv: vi.fn().mockResolvedValue("ID,Has old value\r\naudit-1,true\r\n"),
});

describe("Audit routes through AppModule", () => {
  it("keeps the health route available after audit module integration", async () => {
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

  it("exposes masked audit logs through AppModule", async () => {
    await withAppModule([PermissionCode.auditReadMasked], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .query({
          actorUserId: ids.actor,
          actorDepartmentId: ids.department,
          action: AuditActionCode.update,
          targetType: AuditTargetTypeCode.achievement,
          targetId: ids.target,
          targetDepartmentId: ids.department,
          traceId: "trace-001",
          createdFrom: "2026-06-01T00:00:00.000Z",
          createdTo: "2026-06-30T23:59:59.999Z",
          take: "25",
        })
        .expect(200);

      expect(service.listMasked).toHaveBeenCalledOnce();
      expect(service.listMasked).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.actor,
          departmentId: ids.department,
        }),
        {
          actorUserId: ids.actor,
          actorDepartmentId: ids.department,
          action: AuditActionCode.update,
          targetType: AuditTargetTypeCode.achievement,
          targetId: ids.target,
          targetDepartmentId: ids.department,
          traceId: "trace-001",
          createdFrom: new Date("2026-06-01T00:00:00.000Z"),
          createdTo: new Date("2026-06-30T23:59:59.999Z"),
          take: 25,
        },
      );

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toEqual(
        expect.objectContaining({
          id: ids.auditLog,
          oldValueMasked: expect.objectContaining({
            token: "[REDACTED_SENSITIVE]",
            cookie: "[REDACTED_SENSITIVE]",
            password: "[REDACTED_SENSITIVE]",
            apiKey: "[REDACTED_SENSITIVE]",
            storageKey: "[REDACTED_SENSITIVE]",
            checksum: "[REDACTED_SENSITIVE]",
            configRef: "[REDACTED_SENSITIVE]",
          }),
          ipAddressMasked: "[REDACTED_IP]",
          userAgentMasked: "[REDACTED_USER_AGENT]",
        }),
      );
      expect(response.body.items[0]).not.toHaveProperty("oldValue");
      expect(response.body.items[0]).not.toHaveProperty("newValue");
      expect(response.body.items[0]).not.toHaveProperty("ipAddress");
      expect(response.body.items[0]).not.toHaveProperty("userAgent");
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("raw-token");
      expect(serialized).not.toContain("raw-cookie");
      expect(serialized).not.toContain("raw-password");
      expect(serialized).not.toContain("raw-api-key");
      expect(serialized).not.toContain("raw-storage-key");
      expect(serialized).not.toContain("raw-checksum");
      expect(serialized).not.toContain("raw-config-ref");
    });
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(null, async (app, service, identityAdapter) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(identityAdapter.loadUserContext).toHaveBeenCalledOnce();
      expect(service.listMasked).not.toHaveBeenCalled();
    });
  });

  it("returns 403 through AppModule when audit:read_masked is missing", async () => {
    await withAppModule([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.listMasked).not.toHaveBeenCalled();
      expect(service.exportMaskedCsv).not.toHaveBeenCalled();
    });
  });

  it("exports masked audit logs as CSV without raw sensitive values", async () => {
    await withAppModule([PermissionCode.auditReadMasked], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/audit-logs/export.csv")
        .set("X-Demo-User-Id", ids.actor)
        .query({
          action: AuditActionCode.update,
          targetType: AuditTargetTypeCode.achievement,
          targetId: ids.target,
          take: "25",
        })
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain("audit-logs.csv");
      expect(response.text).toBe("ID,Has old value\r\naudit-1,true\r\n");
      expect(response.text).not.toContain("token");
      expect(response.text).not.toContain("password");
      expect(response.text).not.toContain("cookie");
      expect(service.exportMaskedCsv).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.actor,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          action: AuditActionCode.update,
          targetType: AuditTargetTypeCode.achievement,
          targetId: ids.target,
          take: 25,
        }),
      );
    });
  });

  it("rejects invalid query values through AppModule", async () => {
    await withAppModule([PermissionCode.auditReadMasked], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .query({ action: "UNKNOWN" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .query({ targetType: "UNKNOWN" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .query({ createdFrom: "not-a-date" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .query({ take: "0" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/audit-logs")
        .set("X-Demo-User-Id", ids.actor)
        .query({ take: "101" })
        .expect(400);

      expect(service.listMasked).not.toHaveBeenCalled();
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
      .overrideProvider(AuditService)
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
