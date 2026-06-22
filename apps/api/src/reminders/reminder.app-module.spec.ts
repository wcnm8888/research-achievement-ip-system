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
  ReminderLevelCode,
  ReminderStatusCode,
  ReminderTargetTypeCode,
} from "./domain/reminder-domain.types";
import { ReminderService } from "./reminder.service";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  reminderTask: "90000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type ReminderServiceMock = {
  confirmReminder: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: ReminderServiceMock,
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

const makeConfirmedReminderTask = () => ({
  id: ids.reminderTask,
  targetType: ReminderTargetTypeCode.feeRecord,
  targetId: ids.feeRecord,
  remindDate: new Date("2026-06-18T00:00:00.000Z"),
  remindLevel: ReminderLevelCode.days7,
  receiverId: ids.user,
  status: ReminderStatusCode.confirmed,
  sentAt: new Date("2026-06-18T08:00:00.000Z"),
  confirmedAt: new Date("2026-06-18T09:00:00.000Z"),
});

const createServiceMock = (): ReminderServiceMock => ({
  confirmReminder: vi.fn().mockResolvedValue(makeConfirmedReminderTask()),
});

describe("Reminder routes through AppModule", () => {
  it("keeps the health route available after reminders module integration", async () => {
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

  it("exposes reminder confirm through AppModule", async () => {
    await withAppModule(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post(`/reminders/${ids.reminderTask}/confirm`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.status).toBe(ReminderStatusCode.confirmed);
        expect(service.confirmReminder).toHaveBeenCalledOnce();
        expect(service.confirmReminder).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.reminderTask,
        );
      },
    );
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(null, async (app, service, identityAdapter) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/reminders/${ids.reminderTask}/confirm`)
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(identityAdapter.loadUserContext).toHaveBeenCalledOnce();
      expect(service.confirmReminder).not.toHaveBeenCalled();
    });
  });

  it("returns 403 through AppModule when static permission is missing", async () => {
    await withAppModule([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/reminders/${ids.reminderTask}/confirm`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.confirmReminder).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid UUID params through AppModule", async () => {
    await withAppModule(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post("/reminders/not-a-uuid/confirm")
          .set("X-Demo-User-Id", ids.user)
          .expect(400);

        expect(service.confirmReminder).not.toHaveBeenCalled();
      },
    );
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
      .overrideProvider(ReminderService)
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
