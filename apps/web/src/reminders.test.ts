import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { ApiClient, ApiError } from "./api-client";
import {
  confirmReminder,
  enqueueReminderSlaScan,
  escalateReminder,
  escalateReminderToDepartment,
  fetchReminderCenter,
  fetchReminderEscalationHistory,
  fetchReminderSlaPolicy,
  fetchReminderSlaQueue,
  fetchReminderSlaScanHealth,
  fetchReminderSlaScanMetrics,
  fetchReminderSlaScanRuns,
  formatReminderSlaScanRun,
  formatReminderSlaSuccessRate,
  formatReminderSlaPolicy,
  formatReminderDate,
  getEscalationBlockedReasonLabel,
  getEscalationTargetLabel,
  getReminderGovernanceText,
  getReminderReceiptFollowUpText,
  getReminderReceiptStatus,
  getReminderReceiptStatusLabel,
  getReminderSeverityColor,
  getReminderSlaHealthStatusColor,
  getReminderSlaHealthStatusLabel,
  getReminderSlaScanRunStatusLabel,
  getReminderSlaStatusLabel,
  getReminderSlaTriggerTypeLabel,
  getReminderStatusLabel,
  getReminderTypeLabel,
  normalizeReminderError,
  processNextReminderSlaScan,
  runFullReminderSlaScan,
  runReminderSlaScan,
  updateReminderSlaPolicy,
} from "./reminder-center";
import { Reminders } from "./Reminders";
import type { ReminderCenterResponse } from "./types";

const reminderTaskId = "90000000-0000-4000-8000-000000000001";

const centerResponse: ReminderCenterResponse = {
  generatedAt: "2026-06-18T09:00:00.000Z",
  summary: {
    total: 2,
    feeReminderCount: 1,
    workflowTaskCount: 1,
    pendingCount: 0,
    sentCount: 1,
    overdueCount: 0,
    escalationEligibleCount: 1,
  },
  items: [
    {
      id: reminderTaskId,
      itemType: "FEE_REMINDER",
      title: "费用到期提醒",
      description: "提醒级别：DAYS_7",
      severity: "WARNING",
      status: "SENT",
      targetType: "FEE_RECORD",
      targetId: "80000000-0000-4000-8000-000000000001",
      remindDate: "2026-06-18T00:00:00.000Z",
      remindLevel: "DAYS_7",
      dueAt: "2026-06-18T00:00:00.000Z",
      canConfirm: true,
      canEscalate: false,
      canEscalateToDepartment: false,
      escalationBlockedReason: "RATE_LIMITED",
      lastSentAt: "2026-06-18T10:00:00.000Z",
      nextEscalationAvailableAt: "2026-06-19T10:00:00.000Z",
      governanceNote: "Escalation count is not tracked in this MVP.",
    },
    {
      id: "70000000-0000-4000-8000-000000000001",
      itemType: "WORKFLOW_TASK",
      title: "成果审批待办",
      description: "当前节点：DEPARTMENT_REVIEW",
      severity: "INFO",
      status: "PENDING",
      targetType: "ACHIEVEMENT",
      targetId: "30000000-0000-4000-8000-000000000001",
      dueAt: "2026-06-17T08:00:00.000Z",
      canConfirm: false,
      canEscalate: false,
      canEscalateToDepartment: false,
      escalationBlockedReason: "NOT_APPLICABLE",
      lastSentAt: null,
      nextEscalationAvailableAt: null,
    },
  ],
};

const makeClient = (): ApiClient => ({
  get: vi.fn(async () => centerResponse) as unknown as ApiClient["get"],
  post: vi.fn(async () => ({
    reminderTask: {
      id: reminderTaskId,
      targetType: "FEE_RECORD",
      targetId: "80000000-0000-4000-8000-000000000001",
      remindDate: "2026-06-18T00:00:00.000Z",
      remindLevel: "DAYS_7",
      receiverId: "40000000-0000-4000-8000-000000000001",
      status: "SENT",
    },
    notification: null,
  })) as unknown as ApiClient["post"],
  put: vi.fn(async (_path, body) => body) as unknown as ApiClient["put"],
  patch: vi.fn() as unknown as ApiClient["patch"],
});

describe("reminders api helpers", () => {
  it("loads reminder center from the center endpoint", async () => {
    const client = makeClient();

    await expect(fetchReminderCenter(client)).resolves.toEqual(centerResponse);

    expect(client.get).toHaveBeenCalledWith("/reminders/center");
  });

  it("calls confirm, escalate, and department escalation endpoints with encoded ids", async () => {
    const client = makeClient();

    await confirmReminder(client, reminderTaskId);
    await escalateReminder(client, reminderTaskId);
    await escalateReminderToDepartment(client, reminderTaskId);

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      `/reminders/${reminderTaskId}/confirm`,
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      `/reminders/${reminderTaskId}/escalate`,
    );
    expect(client.post).toHaveBeenNthCalledWith(
      3,
      `/reminders/${reminderTaskId}/escalate-to-department`,
    );
  });

  it("loads SLA queue and escalation history endpoints", async () => {
    const client = makeClient();

    await fetchReminderSlaQueue(client);
    await fetchReminderEscalationHistory(client, reminderTaskId);

    expect(client.get).toHaveBeenNthCalledWith(1, "/reminders/sla-queue");
    expect(client.get).toHaveBeenNthCalledWith(
      2,
      `/reminders/${reminderTaskId}/escalation-history`,
    );
  });

  it("loads SLA policy, persists policy, and runs SLA scan endpoints", async () => {
    const client = makeClient();
    const policy = {
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      cooldownHours: 24,
      scanWindowHours: 24,
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

    await fetchReminderSlaPolicy(client);
    await updateReminderSlaPolicy(client, policy);
    await runReminderSlaScan(client);
    await runFullReminderSlaScan(client);
    await enqueueReminderSlaScan(client, {
      idempotencyKey: "manual-key",
      triggerType: "MANUAL",
    });
    await processNextReminderSlaScan(client);
    await fetchReminderSlaScanRuns(client);
    await fetchReminderSlaScanMetrics(client);
    await fetchReminderSlaScanHealth(client);

    expect(client.get).toHaveBeenCalledWith("/reminders/sla-policy");
    expect(client.put).toHaveBeenCalledWith("/reminders/sla-policy", policy);
    expect(client.post).toHaveBeenNthCalledWith(1, "/reminders/sla-scan/run");
    expect(client.post).toHaveBeenNthCalledWith(2, "/reminders/sla-scan/run-all");
    expect(client.post).toHaveBeenNthCalledWith(3, "/reminders/sla-scan/enqueue", {
      idempotencyKey: "manual-key",
      triggerType: "MANUAL",
    });
    expect(client.post).toHaveBeenNthCalledWith(
      4,
      "/reminders/sla-scan/process-next",
    );
    expect(client.get).toHaveBeenCalledWith("/reminders/sla-scan/runs");
    expect(client.get).toHaveBeenCalledWith("/reminders/sla-scan/metrics");
    expect(client.get).toHaveBeenCalledWith("/reminders/sla-scan/health");
  });
});

describe("reminders display helpers", () => {
  it("maps labels and severity colors without leaking raw payloads", () => {
    const feeItem = centerResponse.items[0];
    const workflowItem = centerResponse.items[1];

    expect(feeItem).toBeDefined();
    expect(workflowItem).toBeDefined();

    expect(getReminderTypeLabel(feeItem!)).toBe("费用提醒");
    expect(getReminderTypeLabel(workflowItem!)).toBe("审批待办");
    expect(getReminderStatusLabel("SENT")).toBe("已发送");
    expect(getReminderStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getReminderSeverityColor("CRITICAL")).toBe("red");
    expect(getReminderSeverityColor("WARNING")).toBe("orange");
    expect(getEscalationBlockedReasonLabel("RATE_LIMITED")).toBe(
      "24 小时内已催办",
    );
    expect(getReminderGovernanceText(feeItem!)).toContain("24 小时内已催办");
    expect(getReminderSlaStatusLabel("OVERDUE")).toBe("已逾期");
    expect(getReminderSlaScanRunStatusLabel("QUEUED")).toBe("排队中");
    expect(getReminderSlaScanRunStatusLabel("SKIPPED")).toBe("已跳过");
    expect(getReminderSlaTriggerTypeLabel("SCHEDULED")).toBe("定时");
    expect(getEscalationTargetLabel("DEPARTMENT_ROLE")).toBe("部门角色");
    expect(
      formatReminderSlaPolicy({
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        cooldownHours: 24,
        scanWindowHours: 24,
        levels: [
          {
            level: 1,
            code: "DEPARTMENT_COORDINATOR",
            afterHours: 0,
            roleCodes: ["DEPARTMENT_ADMIN"],
            scope: "DEPARTMENT",
          },
        ],
      }),
    ).toContain("REMINDER_SLA_DEFAULT_MVP");
    expect(
      formatReminderSlaScanRun({
        id: "run-id",
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: "user-id",
        actorDepartmentId: "department-id",
        scanScope: "ALL_RECEIVERS",
        status: "QUEUED",
        triggerType: "API_QUEUE",
        idempotencyKey: "manual-key",
        lockKey: "REMINDER_SLA_FULL_SCAN",
        lockedAt: null,
        lockedUntil: null,
        attemptCount: 0,
        failureReason: null,
        requestedAt: "2026-06-18T00:00:00.000Z",
        queuedAt: "2026-06-18T00:00:00.000Z",
        scannedCount: 3,
        escalatedCount: 1,
        skippedCount: 2,
        startedAt: "2026-06-18T00:00:00.000Z",
        completedAt: "2026-06-18T00:01:00.000Z",
        createdAt: "2026-06-18T00:00:00.000Z",
        updatedAt: "2026-06-18T00:01:00.000Z",
      }),
    ).toContain("ALL_RECEIVERS");
    expect(formatReminderSlaSuccessRate(0.875)).toBe("88%");
    expect(getReminderSlaHealthStatusLabel("HEALTHY")).toBe("正常");
    expect(getReminderSlaHealthStatusLabel("WARNING")).toBe("预警");
    expect(getReminderSlaHealthStatusLabel("CRITICAL")).toBe("严重");
    expect(getReminderSlaHealthStatusColor("HEALTHY")).toBe("green");
    expect(getReminderSlaHealthStatusColor("WARNING")).toBe("orange");
    expect(getReminderSlaHealthStatusColor("CRITICAL")).toBe("red");
    expect(
      formatReminderSlaScanRun({
        id: "run-id-2",
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: "user-id",
        actorDepartmentId: "department-id",
        scanScope: "ALL_RECEIVERS",
        status: "SKIPPED",
        triggerType: "SCHEDULED",
        idempotencyKey: "scheduled-key",
        lockKey: "REMINDER_SLA_FULL_SCAN",
        lockedAt: null,
        lockedUntil: null,
        attemptCount: 0,
        failureReason: "LOCK_ACTIVE",
        requestedAt: "2026-06-18T00:00:00.000Z",
        queuedAt: "2026-06-18T00:00:00.000Z",
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        startedAt: "2026-06-18T00:00:00.000Z",
        completedAt: "2026-06-18T00:01:00.000Z",
        createdAt: "2026-06-18T00:00:00.000Z",
        updatedAt: "2026-06-18T00:01:00.000Z",
      }),
    ).toContain("已跳过");
  });

  it("maps local notification receipt states to reviewer-facing Chinese labels", () => {
    expect(getReminderReceiptStatusLabel("PENDING_CONFIRMATION")).toBe("待确认");
    expect(getReminderReceiptStatusLabel("CONFIRMED")).toBe("已确认");
    expect(getReminderReceiptStatusLabel("READ_UNCONFIRMED")).toBe("已读未确认");
    expect(getReminderReceiptStatusLabel("CONFIRMATION_TIMEOUT")).toBe("确认超时");
    expect(getReminderReceiptStatusLabel("CONFIRMATION_FAILED")).toBe("确认失败");
    expect(getReminderReceiptStatusLabel("MANUAL_FOLLOW_UP")).toBe(
      "已转人工跟进",
    );

    expect(getReminderReceiptStatus({ ...centerResponse.items[1]!, status: "PENDING" })).toBe(
      "PENDING_CONFIRMATION",
    );
    expect(getReminderReceiptStatus({ ...centerResponse.items[0]!, status: "CONFIRMED" })).toBe(
      "CONFIRMED",
    );
    expect(getReminderReceiptStatus({ ...centerResponse.items[0]!, status: "SENT", escalationBlockedReason: undefined })).toBe(
      "READ_UNCONFIRMED",
    );
    expect(getReminderReceiptStatus(centerResponse.items[0]!)).toBe(
      "CONFIRMATION_TIMEOUT",
    );
    expect(getReminderReceiptStatus({ ...centerResponse.items[0]!, status: "FAILED" })).toBe(
      "CONFIRMATION_FAILED",
    );
    expect(
      getReminderReceiptStatus({
        ...centerResponse.items[0]!,
        canEscalateToDepartment: true,
        escalationBlockedReason: undefined,
      }),
    ).toBe("MANUAL_FOLLOW_UP");
    expect(getReminderReceiptFollowUpText("CONFIRMATION_FAILED")).toContain(
      "人工跟进",
    );
  });

  it("renders local review notification receipt boundary without external delivery claims", () => {
    const html = renderToStaticMarkup(
      createElement(Reminders, { demoUserId: "reviewer-user-id" }),
    );
    const visibleMarkup = html.replace(/\sclass="[^"]*"/g, "");

    expect(html).toContain("本地评审版通知闭环");
    expect(html).toContain("当前支持站内通知摘要和本地回执状态预演");
    expect(html).toContain("邮件通知为系统配置页的本地预演，不真实外发");
    expect(html).toContain("真实邮件、短信、企微送达回执属于二期 / 生产待接入");
    expect(html).toContain("待确认");
    expect(html).toContain("已转人工跟进");
    expect(visibleMarkup).not.toContain("endpoint");
    expect(visibleMarkup).not.toContain("stack");
    expect(visibleMarkup).not.toContain("JSON");
  });

  it("keeps invalid or empty dates stable", () => {
    expect(formatReminderDate(null)).toBe("-");
    expect(formatReminderDate("not-a-date")).toBe("not-a-date");
    expect(formatReminderDate("2026-06-18T00:00:00.000Z")).toContain("2026");
  });

  it("normalizes unknown operation errors to a safe message", () => {
    expect(normalizeReminderError(new Error("raw stack"))).toEqual({
      kind: "unknown",
      message: "提醒操作失败",
    });

    const apiError: ApiError = {
      kind: "forbidden",
      status: 403,
      message: "请选择或切换业务用户",
      detail: "Required permissions are missing.",
    };
    expect(normalizeReminderError(apiError)).toBe(apiError);
    expect(normalizeReminderError(new Error("raw oldValue newValue token"))).not.toEqual(
      expect.objectContaining({
        detail: expect.stringContaining("token"),
      }),
    );
  });
});
