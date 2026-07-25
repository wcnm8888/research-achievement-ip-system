import { describe, expect, it, vi } from "vitest";
import type { ApiClient, ApiError } from "./api-client";
import type { WorkflowTask } from "./types";
import {
  approveWorkflowTask,
  buildApproveWorkflowTaskPayload,
  buildRejectWorkflowTaskPayload,
  buildWorkflowTaskDetailDisplayModel,
  buildWorkflowTaskQuery,
  executeWorkflowTaskAction,
  fetchMyWorkflowTasks,
  fetchWorkflowTaskDetail,
  getWorkflowActionAvailability,
  getWorkflowInstanceStatusLabel,
  getWorkflowStepLabel,
  getWorkflowTargetTypeLabel,
  getWorkflowTaskStatusLabel,
  isFeeReviewWorkflowTask,
  mapWorkflowErrorToDisplay,
  approveWorkflowTaskForTarget,
  rejectWorkflowTask,
  rejectWorkflowTaskForTarget,
} from "./workflow-tasks";

const pendingDepartmentReviewTask: WorkflowTask = {
  id: "task-id",
  instanceId: "instance-id",
  assigneeId: "reviewer-id",
  stepCode: "DEPARTMENT_REVIEW",
  status: "PENDING",
  createdAt: "2026-06-19T01:00:00.000Z",
  updatedAt: "2026-06-19T02:00:00.000Z",
  claimedAt: null,
  completedAt: null,
  instance: {
    targetType: "ACHIEVEMENT",
    targetId: "achievement-id",
    status: "ACTIVE",
    currentStep: "DEPARTMENT_REVIEW",
  },
};

const pendingFeeReviewTask: WorkflowTask = {
  ...pendingDepartmentReviewTask,
  id: "fee-task-id",
  instanceId: "fee-instance-id",
  stepCode: "FEE_REVIEW",
  instance: {
    targetType: "FEE_RECORD",
    targetId: "fee-id",
    status: "ACTIVE",
    currentStep: "FEE_REVIEW",
  },
};

const createClient = (): ApiClient => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
});

describe("buildWorkflowTaskQuery", () => {
  it("keeps status, trims achievementId, and omits unsupported pagination", () => {
    const query = buildWorkflowTaskQuery({
      status: "PENDING",
      achievementId: " achievement-id ",
    } as Record<string, unknown>);

    expect(query).toEqual({
      status: "PENDING",
      targetType: undefined,
      achievementId: "achievement-id",
      feeRecordId: undefined,
    });
    expect(query).not.toHaveProperty("page");
    expect(query).not.toHaveProperty("pageSize");
  });

  it("omits empty achievementId", () => {
    expect(
      buildWorkflowTaskQuery({
        status: "APPROVED",
        achievementId: "   ",
      }),
    ).toEqual({
      status: "APPROVED",
      targetType: undefined,
      achievementId: undefined,
      feeRecordId: undefined,
    });
  });

  it("keeps fee record target filters", () => {
    expect(
      buildWorkflowTaskQuery({
        status: "PENDING",
        targetType: "FEE_RECORD",
        feeRecordId: " fee-id ",
      }),
    ).toEqual({
      status: "PENDING",
      targetType: "FEE_RECORD",
      achievementId: undefined,
      feeRecordId: "fee-id",
    });
  });
});

describe("workflow action payload builders", () => {
  it("omits empty approve comments and trims non-empty comments", () => {
    expect(buildApproveWorkflowTaskPayload("   ")).toBeUndefined();
    expect(buildApproveWorkflowTaskPayload(" 同意 ")).toEqual({ comment: "同意" });
  });

  it("marks empty reject comments invalid and never sends reason", () => {
    expect(buildRejectWorkflowTaskPayload("   ")).toBeUndefined();
    const payload = buildRejectWorkflowTaskPayload(" 材料不完整 ");

    expect(payload).toEqual({ comment: "材料不完整" });
    expect(payload).not.toHaveProperty("reason");
  });
});

describe("getWorkflowActionAvailability", () => {
  it("allows pending department review achievement tasks", () => {
    expect(getWorkflowActionAvailability(pendingDepartmentReviewTask)).toEqual({
      approve: true,
      reject: true,
    });
  });

  it("allows pending fee review tasks", () => {
    expect(getWorkflowActionAvailability(pendingFeeReviewTask)).toEqual({
      approve: true,
      reject: true,
    });
    expect(isFeeReviewWorkflowTask(pendingFeeReviewTask)).toBe(true);
  });

  it("blocks terminal task statuses", () => {
    for (const status of ["APPROVED", "REJECTED", "CANCELLED"] as const) {
      expect(
        getWorkflowActionAvailability({
          ...pendingDepartmentReviewTask,
          status,
        }),
      ).toMatchObject({
        approve: false,
        reject: false,
      });
    }
  });

  it("blocks non-department-review steps", () => {
    expect(
      getWorkflowActionAvailability({
        ...pendingDepartmentReviewTask,
        stepCode: "ARCHIVE",
      }),
    ).toMatchObject({
      approve: false,
      reject: false,
    });
  });

  it("blocks inactive, missing, or non-achievement instances", () => {
    expect(
      getWorkflowActionAvailability({
        ...pendingDepartmentReviewTask,
        instance: { ...pendingDepartmentReviewTask.instance!, status: "COMPLETED" },
      }),
    ).toMatchObject({ approve: false, reject: false });
    expect(
      getWorkflowActionAvailability({
        ...pendingDepartmentReviewTask,
        instance: undefined,
      }),
    ).toMatchObject({ approve: false, reject: false });
    expect(
      getWorkflowActionAvailability({
        ...pendingDepartmentReviewTask,
        instance: { ...pendingDepartmentReviewTask.instance!, targetType: "OTHER" },
      }),
    ).toMatchObject({ approve: false, reject: false });
  });
});

describe("workflow labels and display model", () => {
  it("maps known labels and falls back for unknown values", () => {
    expect(getWorkflowTaskStatusLabel("PENDING")).toBe("待处理");
    expect(getWorkflowStepLabel("DEPARTMENT_REVIEW")).toBe("院系审核");
    expect(getWorkflowInstanceStatusLabel("ACTIVE")).toBe("进行中");
    expect(getWorkflowTargetTypeLabel("ACHIEVEMENT")).toBe("科研成果");
    expect(getWorkflowTaskStatusLabel("CUSTOM")).toBe("CUSTOM");
    expect(getWorkflowStepLabel("CUSTOM")).toBe("CUSTOM");
  });

  it("maps fee review task labels", () => {
    expect(getWorkflowStepLabel("FEE_REVIEW")).toBe("Fee review");
    expect(getWorkflowTargetTypeLabel("FEE_RECORD")).toBe("Fee record");
  });

  it("builds a task/instance-only detail display model", () => {
    const model = buildWorkflowTaskDetailDisplayModel(pendingDepartmentReviewTask);

    expect(model.taskFields.map((field) => field.label)).toContain("任务 ID");
    expect(model.instanceFields).toContainEqual({
      label: "目标 ID",
      value: "achievement-id",
    });
    expect(JSON.stringify(model)).not.toContain("审批历史");
    expect(JSON.stringify(model)).not.toContain("审计");
  });
});

describe("mapWorkflowErrorToDisplay", () => {
  it("maps workflow API errors without changing api-client semantics", () => {
    const cases: Array<[ApiError, string]> = [
      [{ kind: "bad-request", status: 400, message: "请求参数错误" }, "审批请求参数错误"],
      [{ kind: "unauthorized", status: 401, message: "请选择或切换业务用户" }, "请选择或切换业务用户"],
      [{ kind: "forbidden", status: 403, message: "当前角色无权限" }, "当前用户无权处理该审批待办"],
      [{ kind: "unknown", status: 404, message: "资源不存在" }, "审批待办不存在"],
      [{ kind: "unknown", status: 409, message: "数据状态冲突" }, "待办状态已变化，请刷新后重试"],
      [{ kind: "bad-request", status: 422, message: "提交内容不符合业务规则" }, "审批意见不符合业务规则"],
      [{ kind: "network", message: "服务不可用" }, "审批服务不可用"],
      [{ kind: "server", status: 503, message: "服务不可用" }, "审批服务不可用"],
    ];

    cases.forEach(([error, title]) => {
      expect(mapWorkflowErrorToDisplay(error).title).toBe(title);
    });
  });
});

describe("workflow API wrappers", () => {
  it("fetches my workflow tasks with normalized query and result", async () => {
    const client = createClient();
    vi.mocked(client.get).mockResolvedValue({ items: [pendingDepartmentReviewTask] });

    await expect(
      fetchMyWorkflowTasks(client, {
        status: "PENDING",
        achievementId: " achievement-id ",
      }),
    ).resolves.toEqual({
      items: [pendingDepartmentReviewTask],
      total: 1,
    });

    expect(client.get).toHaveBeenCalledWith("/workflow/tasks/my", {
      status: "PENDING",
      targetType: undefined,
      achievementId: "achievement-id",
      feeRecordId: undefined,
    });
  });

  it("fetches workflow task detail by id", async () => {
    const client = createClient();
    vi.mocked(client.get).mockResolvedValue(pendingDepartmentReviewTask);

    await expect(fetchWorkflowTaskDetail(client, "task-id")).resolves.toEqual(
      pendingDepartmentReviewTask,
    );
    expect(client.get).toHaveBeenCalledWith("/workflow/tasks/task-id");
  });

  it("approves workflow tasks with comment payload", async () => {
    const client = createClient();
    const result = { task: { ...pendingDepartmentReviewTask, status: "APPROVED" } };
    vi.mocked(client.post).mockResolvedValue(result);

    await expect(approveWorkflowTask(client, "task-id", " 同意 ")).resolves.toEqual(
      result,
    );
    expect(client.post).toHaveBeenCalledWith("/workflow/tasks/task-id/approve", {
      comment: "同意",
    });
  });

  it("rejects workflow tasks with comment payload and never sends reason", async () => {
    const client = createClient();
    const result = { task: { ...pendingDepartmentReviewTask, status: "REJECTED" } };
    vi.mocked(client.post).mockResolvedValue(result);

    await expect(rejectWorkflowTask(client, "task-id", " 材料不完整 ")).resolves.toEqual(
      result,
    );
    expect(client.post).toHaveBeenCalledWith("/workflow/tasks/task-id/reject", {
      comment: "材料不完整",
    });
    const firstCall = vi.mocked(client.post).mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[1]).not.toHaveProperty("reason");
  });

  it("rejects empty reject comments before calling the API", async () => {
    const client = createClient();

    await expect(rejectWorkflowTask(client, "task-id", "   ")).rejects.toMatchObject({
      kind: "bad-request",
      message: "请填写驳回意见",
    });
    expect(client.post).not.toHaveBeenCalled();
  });

  it("routes fee review task approval through the fee review API with reason payload", async () => {
    const client = createClient();
    const result = { id: "fee-id", reviewStatus: "APPROVED" };
    vi.mocked(client.post).mockResolvedValue(result);

    await expect(
      approveWorkflowTaskForTarget(client, pendingFeeReviewTask, " finance checked "),
    ).resolves.toEqual(result);

    expect(client.post).toHaveBeenCalledWith("/fees/fee-id/review/approve", {
      reason: "finance checked",
    });
  });

  it("routes fee review task rejection through the fee review API with reason payload", async () => {
    const client = createClient();
    const result = { id: "fee-id", reviewStatus: "REJECTED" };
    vi.mocked(client.post).mockResolvedValue(result);

    await expect(
      rejectWorkflowTaskForTarget(client, pendingFeeReviewTask, " missing voucher "),
    ).resolves.toEqual(result);

    expect(client.post).toHaveBeenCalledWith("/fees/fee-id/review/reject", {
      reason: "missing voucher",
    });
  });

  it("keeps achievement workflow actions on the workflow task API", async () => {
    const client = createClient();
    const result = { task: { ...pendingDepartmentReviewTask, status: "APPROVED" } };
    vi.mocked(client.post).mockResolvedValue(result);

    await expect(
      executeWorkflowTaskAction(client, pendingDepartmentReviewTask, "approve", " agree "),
    ).resolves.toEqual(result);

    expect(client.post).toHaveBeenCalledWith("/workflow/tasks/task-id/approve", {
      comment: "agree",
    });
  });
});
