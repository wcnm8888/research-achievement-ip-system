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
  escalateReminder: ReturnType<typeof vi.fn>;
  escalateReminderToDepartment: ReturnType<typeof vi.fn>;
  getReminderCenter: ReturnType<typeof vi.fn>;
  listReminderSlaQueue: ReturnType<typeof vi.fn>;
  listReminderEscalationHistory: ReturnType<typeof vi.fn>;
  getReminderSlaPolicy: ReturnType<typeof vi.fn>;
  updateReminderSlaPolicy: ReturnType<typeof vi.fn>;
  enqueueReminderSlaScan: ReturnType<typeof vi.fn>;
  processNextReminderSlaScan: ReturnType<typeof vi.fn>;
  runReminderSlaScan: ReturnType<typeof vi.fn>;
  runFullReminderSlaScan: ReturnType<typeof vi.fn>;
  listReminderSlaScanRuns: ReturnType<typeof vi.fn>;
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
  escalateReminder: vi.fn().mockResolvedValue({
    reminderTask: {
      ...makeConfirmedReminderTask(),
      status: ReminderStatusCode.sent,
      confirmedAt: null,
    },
    notification: {
      id: "91000000-0000-4000-8000-000000000001",
      receiverId: ids.user,
      channel: "IN_APP",
      status: "SENT",
      sentAt: new Date("2026-06-18T09:00:00.000Z"),
    },
  }),
  escalateReminderToDepartment: vi.fn().mockResolvedValue({
    reminderTask: {
      ...makeConfirmedReminderTask(),
      status: ReminderStatusCode.sent,
      remindLevel: ReminderLevelCode.overdue,
      confirmedAt: null,
    },
    notification: {
      id: "91000000-0000-4000-8000-000000000002",
      receiverId: ids.user,
      channel: "IN_APP",
      status: "SENT",
      sentAt: new Date("2026-06-18T09:00:00.000Z"),
    },
    escalationTarget: "SELF_MVP_FALLBACK",
    escalationReceiverId: ids.user,
    resolverStrategy: "SELF_MVP_FALLBACK:NO_DEPARTMENT_ROLE_CANDIDATE",
  }),
  getReminderCenter: vi.fn().mockResolvedValue({
    generatedAt: "2026-06-18T09:00:00.000Z",
    summary: {
      total: 1,
      feeReminderCount: 1,
      workflowTaskCount: 0,
      pendingCount: 0,
      sentCount: 1,
      overdueCount: 0,
      escalationEligibleCount: 1,
    },
    items: [
      {
        id: ids.reminderTask,
        itemType: "FEE_REMINDER",
        title: "费用到期提醒",
        description: "提醒级别：DAYS_7",
        severity: "WARNING",
        status: ReminderStatusCode.sent,
        targetType: ReminderTargetTypeCode.feeRecord,
        targetId: ids.feeRecord,
        remindDate: "2026-06-18T00:00:00.000Z",
        remindLevel: ReminderLevelCode.days7,
        dueAt: "2026-06-18T00:00:00.000Z",
        canConfirm: true,
        canEscalate: true,
        canEscalateToDepartment: false,
        lastSentAt: "2026-06-18T08:00:00.000Z",
        nextEscalationAvailableAt: null,
      },
    ],
  }),
  listReminderSlaQueue: vi.fn().mockResolvedValue({
    generatedAt: "2026-06-18T09:00:00.000Z",
    items: [
      {
        id: ids.reminderTask,
        itemType: "FEE_REMINDER",
        title: "费用逾期提醒",
        description: "提醒级别：OVERDUE",
        severity: "CRITICAL",
        status: ReminderStatusCode.sent,
        targetType: ReminderTargetTypeCode.feeRecord,
        targetId: ids.feeRecord,
        remindDate: "2026-06-18T00:00:00.000Z",
        remindLevel: ReminderLevelCode.overdue,
        dueAt: "2026-06-18T00:00:00.000Z",
        canConfirm: true,
        canEscalate: true,
        canEscalateToDepartment: true,
        slaStatus: "OVERDUE",
        escalationTarget: "DEPARTMENT_ROLE",
      },
    ],
  }),
  listReminderEscalationHistory: vi.fn().mockResolvedValue({
    items: [
      {
        id: "audit-id",
        actorUserId: ids.user,
        actorDepartmentId: ids.department,
        operation: "ESCALATE_REMINDER_TO_DEPARTMENT",
        escalationReceiverId: ids.user,
        escalationTarget: "SELF_MVP_FALLBACK",
        resolverStrategy: "SELF_MVP_FALLBACK:NO_DEPARTMENT_ROLE_CANDIDATE",
        notificationId: "91000000-0000-4000-8000-000000000002",
        status: ReminderStatusCode.sent,
        sentAt: "2026-06-18T09:00:00.000Z",
        nextEscalationAvailableAt: null,
        createdAt: "2026-06-18T09:00:00.000Z",
      },
    ],
  }),
  getReminderSlaPolicy: vi.fn().mockReturnValue({
    policyCode: "REMINDER_SLA_DEFAULT_MVP",
    scanWindowHours: 24,
    cooldownHours: 24,
    levels: [
      {
        level: 1,
        code: "DEPARTMENT_COORDINATOR",
        afterHours: 0,
        roleCodes: ["DEPARTMENT_ADMIN", "RESEARCH_SECRETARY"],
        scope: "DEPARTMENT",
      },
    ],
  }),
  updateReminderSlaPolicy: vi.fn().mockImplementation(async (_context, input) => input),
  enqueueReminderSlaScan: vi.fn().mockResolvedValue({
    status: "QUEUED",
    scanRun: {
      id: "99000000-0000-4000-8000-000000000002",
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      actorUserId: ids.user,
      actorDepartmentId: ids.department,
      scanScope: "ALL_RECEIVERS",
      status: "QUEUED",
      triggerType: "API_QUEUE",
      idempotencyKey: "manual-key",
      lockKey: "REMINDER_SLA_FULL_SCAN",
      lockedAt: null,
      lockedUntil: null,
      attemptCount: 0,
      failureReason: null,
      requestedAt: "2026-06-18T09:00:00.000Z",
      queuedAt: "2026-06-18T09:00:00.000Z",
      scannedCount: 0,
      escalatedCount: 0,
      skippedCount: 0,
      safeSummary: null,
      startedAt: "2026-06-18T09:00:00.000Z",
      completedAt: null,
      createdAt: "2026-06-18T09:00:00.000Z",
      updatedAt: "2026-06-18T09:00:00.000Z",
    },
  }),
  processNextReminderSlaScan: vi.fn().mockResolvedValue({
    status: "COMPLETED",
    scanRun: {
      id: "99000000-0000-4000-8000-000000000002",
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      actorUserId: ids.user,
      actorDepartmentId: ids.department,
      scanScope: "ALL_RECEIVERS",
      status: "COMPLETED",
      triggerType: "API_QUEUE",
      idempotencyKey: "manual-key",
      lockKey: "REMINDER_SLA_FULL_SCAN",
      lockedAt: "2026-06-18T09:00:00.000Z",
      lockedUntil: "2026-06-18T09:15:00.000Z",
      attemptCount: 1,
      failureReason: null,
      requestedAt: "2026-06-18T09:00:00.000Z",
      queuedAt: "2026-06-18T09:00:00.000Z",
      scannedCount: 1,
      escalatedCount: 1,
      skippedCount: 0,
      safeSummary: null,
      startedAt: "2026-06-18T09:00:00.000Z",
      completedAt: "2026-06-18T09:00:00.000Z",
      createdAt: "2026-06-18T09:00:00.000Z",
      updatedAt: "2026-06-18T09:00:00.000Z",
    },
  }),
  runReminderSlaScan: vi.fn().mockResolvedValue({
    scannedCount: 1,
    escalatedCount: 1,
    skippedCount: 0,
    escalated: [
      {
        reminderTaskId: ids.reminderTask,
        escalationLevel: 1,
        escalationReceiverId: ids.user,
        escalationTarget: "SELF_MVP_FALLBACK",
        resolverStrategy: "SLA_LEVEL_1:SELF_MVP_FALLBACK:NO_ROLE_CANDIDATE",
      },
    ],
    skipped: [],
    policy: {
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      scanWindowHours: 24,
      cooldownHours: 24,
      levels: [],
    },
  }),
  runFullReminderSlaScan: vi.fn().mockResolvedValue({
    scannedCount: 1,
    escalatedCount: 1,
    skippedCount: 0,
    escalated: [
      {
        reminderTaskId: ids.reminderTask,
        escalationLevel: 1,
        escalationReceiverId: ids.user,
        escalationTarget: "SELF_MVP_FALLBACK",
        resolverStrategy: "SLA_LEVEL_1:SELF_MVP_FALLBACK:NO_ROLE_CANDIDATE",
      },
    ],
    skipped: [],
    policy: {
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      scanWindowHours: 24,
      cooldownHours: 24,
      levels: [],
    },
    scanRun: {
      id: "99000000-0000-4000-8000-000000000001",
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      actorUserId: ids.user,
      actorDepartmentId: ids.department,
      scanScope: "ALL_RECEIVERS",
      status: "COMPLETED",
      triggerType: "MANUAL",
      idempotencyKey: null,
      lockKey: "REMINDER_SLA_FULL_SCAN",
      lockedAt: "2026-06-18T09:00:00.000Z",
      lockedUntil: "2026-06-18T09:15:00.000Z",
      attemptCount: 1,
      failureReason: null,
      requestedAt: "2026-06-18T09:00:00.000Z",
      queuedAt: null,
      scannedCount: 1,
      escalatedCount: 1,
      skippedCount: 0,
      safeSummary: null,
      startedAt: "2026-06-18T09:00:00.000Z",
      completedAt: "2026-06-18T09:00:00.000Z",
      createdAt: "2026-06-18T09:00:00.000Z",
      updatedAt: "2026-06-18T09:00:00.000Z",
    },
  }),
  listReminderSlaScanRuns: vi.fn().mockResolvedValue({
    items: [
      {
        id: "99000000-0000-4000-8000-000000000001",
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.user,
        actorDepartmentId: ids.department,
        scanScope: "ALL_RECEIVERS",
        status: "COMPLETED",
        triggerType: "MANUAL",
        idempotencyKey: null,
        lockKey: "REMINDER_SLA_FULL_SCAN",
        lockedAt: "2026-06-18T09:00:00.000Z",
        lockedUntil: "2026-06-18T09:15:00.000Z",
        attemptCount: 1,
        failureReason: null,
        requestedAt: "2026-06-18T09:00:00.000Z",
        queuedAt: null,
        scannedCount: 1,
        escalatedCount: 1,
        skippedCount: 0,
        safeSummary: null,
        startedAt: "2026-06-18T09:00:00.000Z",
        completedAt: "2026-06-18T09:00:00.000Z",
        createdAt: "2026-06-18T09:00:00.000Z",
        updatedAt: "2026-06-18T09:00:00.000Z",
      },
    ],
  }),
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

  it("returns reminder center with reminder:read_department", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/reminders/center")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.summary.feeReminderCount).toBe(1);
        expect(response.body.items[0]).toMatchObject({
          itemType: "FEE_REMINDER",
          targetId: ids.feeRecord,
          canConfirm: true,
          canEscalate: true,
        });
        expect(service.getReminderCenter).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
        );
      },
    );
  });

  it("escalates a reminder with reminder:read_department and returns 200", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post(`/reminders/${ids.reminderTask}/escalate`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.reminderTask.status).toBe(ReminderStatusCode.sent);
        expect(service.escalateReminder).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.reminderTask,
        );
      },
    );
  });

  it("escalates an overdue reminder to department fallback and returns 200", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post(`/reminders/${ids.reminderTask}/escalate-to-department`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.escalationTarget).toBe("SELF_MVP_FALLBACK");
        expect(response.body.escalationReceiverId).toBe(ids.user);
        expect(service.escalateReminderToDepartment).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.reminderTask,
        );
      },
    );
  });

  it("returns the reminder SLA queue with reminder:read_department", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/reminders/sla-queue")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.items[0]).toMatchObject({
          itemType: "FEE_REMINDER",
          slaStatus: "OVERDUE",
          escalationTarget: "DEPARTMENT_ROLE",
        });
        expect(service.listReminderSlaQueue).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
        );
      },
    );
  });

  it("returns reminder escalation history with reminder:read_department", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .get(`/reminders/${ids.reminderTask}/escalation-history`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.items[0]).toMatchObject({
          operation: "ESCALATE_REMINDER_TO_DEPARTMENT",
          escalationTarget: "SELF_MVP_FALLBACK",
        });
        expect(service.listReminderEscalationHistory).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          ids.reminderTask,
        );
      },
    );
  });

  it("returns SLA policy with reminder:read_department", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/reminders/sla-policy")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.policyCode).toBe("REMINDER_SLA_DEFAULT_MVP");
        expect(service.getReminderSlaPolicy).toHaveBeenCalledTimes(1);
      },
    );
  });

  it("runs SLA scan with reminder:read_department", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        const response = await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/run")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(response.body.escalatedCount).toBe(1);
        expect(service.runReminderSlaScan).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
        );
      },
    );
  });

  it("updates SLA policy with system:config", async () => {
    await withTestApp(
      [PermissionCode.systemConfig],
      async (app, service) => {
        const payload = {
          policyCode: "REMINDER_SLA_DEFAULT_MVP",
          scanWindowHours: 24,
          cooldownHours: 24,
          levels: [
            {
              level: 1,
              code: "DEPARTMENT_COORDINATOR",
              afterHours: 0,
              roleCodes: ["DEPARTMENT_ADMIN"],
              scope: "DEPARTMENT",
            },
          ],
        };
        const response = await request(app.getHttpServer() as Server)
          .put("/reminders/sla-policy")
          .set("X-Demo-User-Id", ids.user)
          .send(payload)
          .expect(200);

        expect(response.body.policyCode).toBe("REMINDER_SLA_DEFAULT_MVP");
        expect(service.updateReminderSlaPolicy).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          payload,
        );
      },
    );
  });

  it("runs full SLA scan and lists scan runs with system:config", async () => {
    await withTestApp(
      [PermissionCode.systemConfig],
      async (app, service) => {
        const scanResponse = await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/run-all")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(scanResponse.body.scanRun.scanScope).toBe("ALL_RECEIVERS");
        expect(service.runFullReminderSlaScan).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
        );

        const runsResponse = await request(app.getHttpServer() as Server)
          .get("/reminders/sla-scan/runs")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(runsResponse.body.items[0]).toMatchObject({
          scanScope: "ALL_RECEIVERS",
          status: "COMPLETED",
        });
        expect(service.listReminderSlaScanRuns).toHaveBeenCalledTimes(1);
      },
    );
  });

  it("enqueues and processes SLA scan jobs with system:config", async () => {
    await withTestApp(
      [PermissionCode.systemConfig],
      async (app, service) => {
        const enqueueResponse = await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/enqueue")
          .set("X-Demo-User-Id", ids.user)
          .send({ idempotencyKey: " manual-key ", triggerType: "MANUAL" })
          .expect(200);

        expect(enqueueResponse.body.status).toBe("QUEUED");
        expect(enqueueResponse.body.scanRun.status).toBe("QUEUED");
        expect(service.enqueueReminderSlaScan).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
          { idempotencyKey: " manual-key ", triggerType: "MANUAL" },
        );

        const processResponse = await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/process-next")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(processResponse.body.status).toBe("COMPLETED");
        expect(service.processNextReminderSlaScan).toHaveBeenCalledWith(
          expect.objectContaining<Partial<UserContext>>({
            userId: ids.user,
            departmentId: ids.department,
          }),
        );
      },
    );
  });

  it("rejects full SLA governance endpoints without system:config", async () => {
    await withTestApp(
      [PermissionCode.reminderReadDepartment],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/run-all")
          .set("X-Demo-User-Id", ids.user)
          .expect(403);
        await request(app.getHttpServer() as Server)
          .put("/reminders/sla-policy")
          .set("X-Demo-User-Id", ids.user)
          .send({})
          .expect(403);
        await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/enqueue")
          .set("X-Demo-User-Id", ids.user)
          .send({})
          .expect(403);
        await request(app.getHttpServer() as Server)
          .post("/reminders/sla-scan/process-next")
          .set("X-Demo-User-Id", ids.user)
          .expect(403);

        expect(service.runFullReminderSlaScan).not.toHaveBeenCalled();
        expect(service.updateReminderSlaPolicy).not.toHaveBeenCalled();
        expect(service.enqueueReminderSlaScan).not.toHaveBeenCalled();
        expect(service.processNextReminderSlaScan).not.toHaveBeenCalled();
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
