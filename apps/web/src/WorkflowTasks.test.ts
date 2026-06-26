import { describe, expect, it } from "vitest";
import type { WorkflowTask } from "./types";
import {
  buildWorkflowTaskActionFailureTransition,
  buildWorkflowTaskActionSubmission,
  buildWorkflowTaskActionSuccessTransition,
  buildWorkflowTaskDrawerViewModel,
  buildWorkflowTaskListDisplayRow,
  buildWorkflowTaskListQuery,
  canReviewDepartmentAchievements,
  getWorkflowTaskActionPresentation,
  getWorkbenchWorkflowNavKey,
} from "./WorkflowTasks";
import {
  getWorkflowTaskLinkedAchievementId,
  getWorkflowTaskLinkedAchievementState,
} from "./workflow-tasks";

const baseTask: WorkflowTask = {
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

describe("buildWorkflowTaskListQuery", () => {
  it("keeps the default pending status", () => {
    expect(buildWorkflowTaskListQuery({ status: "PENDING" })).toEqual({
      status: "PENDING",
      achievementId: undefined,
    });
  });

  it("passes status filters and trims achievementId without pagination", () => {
    const query = buildWorkflowTaskListQuery({
      status: "APPROVED",
      achievementId: " achievement-id ",
    });

    expect(query).toEqual({
      status: "APPROVED",
      achievementId: "achievement-id",
    });
    expect(query).not.toHaveProperty("page");
    expect(query).not.toHaveProperty("pageSize");
  });

  it("omits empty achievementId", () => {
    expect(
      buildWorkflowTaskListQuery({
        status: "REJECTED",
        achievementId: "   ",
      }),
    ).toEqual({
      status: "REJECTED",
      achievementId: undefined,
    });
  });
});

describe("buildWorkflowTaskListDisplayRow", () => {
  it("uses task and instance labels for the list row", () => {
    expect(buildWorkflowTaskListDisplayRow(baseTask)).toMatchObject({
      id: "task-id",
      instanceId: "instance-id",
      stepLabel: "院系审核",
      statusLabel: "待处理",
      targetTypeLabel: "科研成果",
      targetId: "achievement-id",
      instanceStatusLabel: "进行中",
      instanceStepLabel: "院系审核",
    });
  });

  it("falls back when instance is missing", () => {
    expect(buildWorkflowTaskListDisplayRow({ ...baseTask, instance: undefined })).toMatchObject({
      targetTypeLabel: "未返回",
      targetId: "未返回",
      instanceStatusLabel: "未返回",
      instanceStepLabel: "未返回",
    });
  });
});

describe("workflow task detail drawer helpers", () => {
  it("builds the drawer view from the Step 13A detail display model", () => {
    const viewModel = buildWorkflowTaskDrawerViewModel(baseTask);

    expect(viewModel.detailFields.taskFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "task-id" }),
        expect.objectContaining({ value: "instance-id" }),
        expect.objectContaining({ value: "reviewer-id" }),
      ]),
    );
    expect(viewModel.detailFields.instanceFields).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "achievement-id" })]),
    );
    expect(viewModel.linkedAchievement).toMatchObject({
      available: true,
      achievementId: "achievement-id",
    });
    expect(viewModel.linkedAchievementId).toBe("achievement-id");
  });

  it("maps an actionable task to approve and reject entries", () => {
    expect(getWorkflowTaskActionPresentation(baseTask)).toEqual({
      actions: ["approve", "reject"],
    });
  });

  it("shows approve and reject only with achievement:review_department", () => {
    const secretary = { permissionCodes: ["achievement:review_department"] };
    const researcher = { permissionCodes: ["achievement:create", "achievement:update_own"] };
    const auditor = { permissionCodes: ["audit:read_masked"] };

    expect(canReviewDepartmentAchievements(secretary)).toBe(true);
    expect(getWorkflowTaskActionPresentation(baseTask, secretary)).toEqual({
      actions: ["approve", "reject"],
    });
    expect(canReviewDepartmentAchievements(researcher)).toBe(false);
    expect(getWorkflowTaskActionPresentation(baseTask, researcher)).toEqual({
      actions: [],
      readonlyReason: "当前用户无审批处理权限",
    });
    expect(canReviewDepartmentAchievements(auditor)).toBe(false);
    expect(getWorkflowTaskActionPresentation(baseTask, auditor)).toEqual({
      actions: [],
      readonlyReason: "当前用户无审批处理权限",
    });
  });

  it("maps a non-actionable task to readonly state", () => {
    const presentation = getWorkflowTaskActionPresentation({
      ...baseTask,
      status: "APPROVED",
    });

    expect(presentation.actions).toEqual([]);
    expect(presentation.readonlyReason).toBeTruthy();
  });
});

describe("workflow linked achievement helper", () => {
  it("enables linked achievement reading for ACHIEVEMENT targets with targetId", () => {
    expect(getWorkflowTaskLinkedAchievementId(baseTask)).toBe("achievement-id");
    expect(getWorkflowTaskLinkedAchievementState(baseTask)).toMatchObject({
      available: true,
      achievementId: "achievement-id",
    });
  });

  it("does not enable linked achievement reading for non-achievement targets", () => {
    const task = {
        ...baseTask,
        instance: {
          ...baseTask.instance!,
          targetType: "OTHER_TARGET",
          targetId: "achievement-id",
        },
      };

    expect(getWorkflowTaskLinkedAchievementId(task)).toBeNull();
    expect(getWorkflowTaskLinkedAchievementState(task)).toMatchObject({
      available: false,
      achievementId: null,
    });
  });

  it("does not enable linked achievement reading when targetId is blank", () => {
    const task = {
        ...baseTask,
        instance: {
          ...baseTask.instance!,
          targetId: "   ",
        },
      };

    expect(getWorkflowTaskLinkedAchievementId(task)).toBeNull();
    expect(getWorkflowTaskLinkedAchievementState(task)).toMatchObject({
      available: false,
      achievementId: null,
    });
  });

  it("does not enable linked achievement reading when the instance is missing", () => {
    const task = { ...baseTask, instance: undefined };

    expect(getWorkflowTaskLinkedAchievementId(task)).toBeNull();
    expect(getWorkflowTaskLinkedAchievementState(task)).toMatchObject({
      available: false,
      achievementId: null,
    });
  });
});

describe("workflow task action submission", () => {
  it("omits an empty approve comment", () => {
    expect(buildWorkflowTaskActionSubmission("approve", "   ")).toEqual({
      valid: true,
      payload: undefined,
    });
  });

  it("trims a non-empty approve comment", () => {
    expect(buildWorkflowTaskActionSubmission("approve", " agree ")).toEqual({
      valid: true,
      payload: { comment: "agree" },
    });
  });

  it("rejects an empty reject comment before calling the API", () => {
    const submission = buildWorkflowTaskActionSubmission("reject", "   ");

    expect(submission.valid).toBe(false);
    if (!submission.valid) {
      expect(submission.error.kind).toBe("bad-request");
    }
  });

  it("sends only comment for reject and never reason", () => {
    const submission = buildWorkflowTaskActionSubmission("reject", " needs changes ");

    expect(submission).toEqual({
      valid: true,
      payload: { comment: "needs changes" },
    });
    if (submission.valid) {
      expect(submission.payload).not.toHaveProperty("reason");
    }
  });
});

describe("workflow task action state transitions", () => {
  it("closes action and detail state after success and requests list refresh", () => {
    expect(buildWorkflowTaskActionSuccessTransition()).toEqual({
      activeAction: null,
      actionComment: "",
      actionError: null,
      selectedTaskId: null,
      shouldRefreshList: true,
    });
  });

  it("keeps input and modal state after failure", () => {
    const transition = buildWorkflowTaskActionFailureTransition(
      {
        activeAction: "reject",
        actionComment: " keep this ",
        selectedTaskId: "task-id",
      },
      {
        kind: "server",
        status: 500,
        message: "Service unavailable",
      },
    );

    expect(transition).toMatchObject({
      activeAction: "reject",
      actionComment: " keep this ",
      selectedTaskId: "task-id",
      shouldRefreshList: false,
    });
    expect(transition.actionError).toMatchObject({
      kind: "server",
      status: 500,
    });
  });
});

describe("Workbench workflow navigation", () => {
  it("uses the workflow nav key", () => {
    expect(getWorkbenchWorkflowNavKey()).toBe("workflow");
  });
});
