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
import {
  ReminderLevelCode,
  ReminderStatusCode,
  ReminderTargetTypeCode,
} from "./domain/reminder-domain.types";
import {
  ReminderAccessDeniedError,
  ReminderConflictError,
  ReminderInvalidTransitionError,
  ReminderNotFoundError,
} from "./domain/reminder-errors";
import { ReminderService } from "./reminder.service";
import { RemindersModule } from "./reminders.module";

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

describe("ReminderController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/reminders/${ids.reminderTask}/confirm`)
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.confirmReminder).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when reminder read permission is missing", async () => {
    await withTestApp([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/reminders/${ids.reminderTask}/confirm`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.confirmReminder).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid UUID params with 400", async () => {
    await withTestApp(
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

  it("confirms a reminder with reminder:read_department and returns 200", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post(`/reminders/${ids.reminderTask}/confirm`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.status).toBe(ReminderStatusCode.confirmed);
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

  it("maps service errors to HTTP status codes", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const cases = [
          {
            error: new ReminderAccessDeniedError("User context is required."),
            expectedStatus: 403,
          },
          {
            error: new ReminderNotFoundError(),
            expectedStatus: 404,
          },
          {
            error: new ReminderConflictError("Reminder task is stale."),
            expectedStatus: 409,
          },
          {
            error: new ReminderInvalidTransitionError(
              ReminderStatusCode.pending,
              ReminderStatusCode.confirmed,
            ),
            expectedStatus: 409,
          },
        ];

        for (const testCase of cases) {
          service.confirmReminder.mockRejectedValueOnce(testCase.error);

          await request(app.getHttpServer() as Server)
            .post(`/reminders/${ids.reminderTask}/confirm`)
            .set("X-Demo-User-Id", ids.user)
            .expect(testCase.expectedStatus);
        }
      },
    );
  });

  it("uses the identity adapter context at the HTTP boundary", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service, identityAdapter) => {
        await request(app.getHttpServer() as Server)
          .post(`/reminders/${ids.reminderTask}/confirm`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(identityAdapter.loadUserContext).toHaveBeenCalledWith({
          headers: expect.objectContaining({
            "x-demo-user-id": ids.user,
          }),
        });
        expect(service.confirmReminder).toHaveBeenCalledTimes(1);
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
      imports: [RemindersModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(ReminderService)
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
