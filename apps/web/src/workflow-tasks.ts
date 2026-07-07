import { isApiError, type ApiClient, type ApiError } from "./api-client";
import type {
  ApproveWorkflowTaskPayload,
  RejectWorkflowTaskPayload,
  WorkflowActionKind,
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTargetTypeCode,
  WorkflowTask,
  WorkflowTaskInstance,
  WorkflowTaskActionResult,
  WorkflowTaskListResult,
  WorkflowTaskQuery,
  WorkflowTaskStatusCode,
} from "./types";

export type WorkflowActionAvailability = {
  approve: boolean;
  reject: boolean;
  reason?: string;
};

export type WorkflowTaskDetailDisplayModel = {
  taskFields: Array<{ label: string; value: string }>;
  instanceFields: Array<{ label: string; value: string }>;
};

export type WorkflowTaskLinkedAchievementState =
  | {
      available: true;
      achievementId: string;
      message: string;
      description: string;
    }
  | {
      available: false;
      achievementId: null;
      message: string;
      description: string;
    };

export type WorkflowErrorDisplay = {
  title: string;
  description?: string;
};

const workflowTaskStatusLabels: Record<WorkflowTaskStatusCode, string> = {
  PENDING: "待处理",
  CLAIMED: "已领取",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  CANCELLED: "已取消",
};

const workflowStepLabels: Record<WorkflowStepCode, string> = {
  FEE_REVIEW: "Fee review",
  DEPARTMENT_REVIEW: "院系审核",
  ARCHIVE: "归档",
};

const workflowInstanceStatusLabels: Record<WorkflowInstanceStatusCode, string> = {
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const workflowTargetTypeLabels: Record<WorkflowTargetTypeCode, string> = {
  FEE_RECORD: "Fee record",
  ACHIEVEMENT: "科研成果",
};

export const buildWorkflowTaskQuery = (
  input: Partial<WorkflowTaskQuery> = {},
): WorkflowTaskQuery => {
  const achievementId = input.achievementId?.trim();
  const feeRecordId = input.feeRecordId?.trim();

  return {
    status: input.status,
    targetType: input.targetType,
    achievementId: achievementId || undefined,
    feeRecordId: feeRecordId || undefined,
  };
};

export const buildApproveWorkflowTaskPayload = (
  comment?: string,
): ApproveWorkflowTaskPayload | undefined => {
  const trimmed = comment?.trim();
  return trimmed ? { comment: trimmed } : undefined;
};

export const buildRejectWorkflowTaskPayload = (
  comment: string,
): RejectWorkflowTaskPayload | undefined => {
  const trimmed = comment.trim();
  return trimmed ? { comment: trimmed } : undefined;
};

export const getWorkflowTaskStatusLabel = (status: string): string =>
  workflowTaskStatusLabels[status as WorkflowTaskStatusCode] ?? (status || "未知状态");

export const getWorkflowStepLabel = (stepCode: string | null | undefined): string =>
  stepCode ? workflowStepLabels[stepCode as WorkflowStepCode] ?? stepCode : "未返回";

export const getWorkflowInstanceStatusLabel = (status: string): string =>
  workflowInstanceStatusLabels[status as WorkflowInstanceStatusCode] ??
  (status || "未知状态");

export const getWorkflowTargetTypeLabel = (targetType: string): string =>
  workflowTargetTypeLabels[targetType as WorkflowTargetTypeCode] ??
  (targetType || "未知目标");

export const getWorkflowActionAvailability = (
  task: WorkflowTask,
): WorkflowActionAvailability => {
  const unavailable = (reason: string): WorkflowActionAvailability => ({
    approve: false,
    reject: false,
    reason,
  });

  if (task.status !== "PENDING") {
    return unavailable("当前任务不是待处理状态");
  }

  if (
    task.stepCode === "FEE_REVIEW" &&
    task.instance?.status === "ACTIVE" &&
    task.instance.currentStep === "FEE_REVIEW" &&
    task.instance.targetType === "FEE_RECORD" &&
    Boolean(task.instance.targetId?.trim())
  ) {
    return {
      approve: true,
      reject: true,
    };
  }

  if (task.stepCode !== "DEPARTMENT_REVIEW") {
    return unavailable("当前任务不是院系审核步骤");
  }

  if (!task.instance) {
    return unavailable("未返回流程实例信息");
  }

  if (task.instance.status !== "ACTIVE") {
    return unavailable("流程实例不是进行中状态");
  }

  if (task.instance.currentStep !== "DEPARTMENT_REVIEW") {
    return unavailable("流程实例当前步骤不是院系审核");
  }

  if (task.instance.targetType !== "ACHIEVEMENT") {
    return unavailable("当前任务目标不是科研成果");
  }

  return {
    approve: true,
    reject: true,
  };
};

export const getWorkflowTaskLinkedAchievementId = (task: WorkflowTask): string | null => {
  if (task.instance?.targetType !== "ACHIEVEMENT") {
    return null;
  }

  const targetId = task.instance.targetId.trim();
  return targetId || null;
};

export const getWorkflowTaskLinkedAchievementState = (
  task: WorkflowTask,
): WorkflowTaskLinkedAchievementState => {
  if (!task.instance) {
    return {
      available: false,
      achievementId: null,
      message: "未返回流程目标信息",
      description: "后端未返回流程实例目标，当前审批任务不能打开关联成果详情。",
    };
  }

  if (task.instance.targetType !== "ACHIEVEMENT") {
    return {
      available: false,
      achievementId: null,
      message: "当前任务没有关联科研成果入口",
      description: "只有目标类型为 ACHIEVEMENT 的审批任务才会提供关联成果只读查看。",
    };
  }

  const targetId = task.instance.targetId.trim();

  if (!targetId) {
    return {
      available: false,
      achievementId: null,
      message: "缺少关联成果 ID",
      description: "后端未返回可用 targetId，前端不会构造或猜测成果 ID。",
    };
  }

  return {
    available: true,
    achievementId: targetId,
    message: "可查看关联科研成果",
    description:
      "审批上下文仅提供关联成果的只读查看，不提供提交、作废或归档动作。",
  };
};

export const buildWorkflowTaskDetailDisplayModel = (
  task: WorkflowTask,
): WorkflowTaskDetailDisplayModel => ({
  taskFields: [
    { label: "任务 ID", value: task.id },
    { label: "流程实例 ID", value: task.instanceId },
    { label: "处理人", value: task.assigneeId },
    { label: "任务步骤", value: getWorkflowStepLabel(task.stepCode) },
    { label: "任务状态", value: getWorkflowTaskStatusLabel(task.status) },
    { label: "创建时间", value: formatDisplayValue(task.createdAt) },
    { label: "更新时间", value: formatDisplayValue(task.updatedAt) },
    { label: "领取时间", value: formatDisplayValue(task.claimedAt) },
    { label: "完成时间", value: formatDisplayValue(task.completedAt) },
  ],
  instanceFields: [
    {
      label: "目标类型",
      value: task.instance ? getWorkflowTargetTypeLabel(task.instance.targetType) : "未返回",
    },
    { label: "目标 ID", value: formatDisplayValue(task.instance?.targetId) },
    {
      label: "流程状态",
      value: task.instance
        ? getWorkflowInstanceStatusLabel(task.instance.status)
        : "未返回",
    },
    { label: "当前步骤", value: getWorkflowStepLabel(task.instance?.currentStep) },
  ],
});

export const mapWorkflowErrorToDisplay = (error: unknown): WorkflowErrorDisplay => {
  const apiError = normalizeWorkflowError(error);

  if (apiError.status === 400) {
    return { title: "审批请求参数错误", description: apiError.detail };
  }

  if (apiError.status === 401) {
    return { title: "请选择或切换演示用户", description: apiError.detail };
  }

  if (apiError.status === 403) {
    return { title: "当前用户无权处理该审批待办", description: apiError.detail };
  }

  if (apiError.status === 404) {
    return { title: "审批待办不存在", description: apiError.detail };
  }

  if (apiError.status === 409) {
    return { title: "待办状态已变化，请刷新后重试", description: apiError.detail };
  }

  if (apiError.status === 422) {
    return { title: "审批意见不符合业务规则", description: apiError.detail };
  }

  if (apiError.kind === "network" || apiError.kind === "server") {
    return { title: "审批服务不可用", description: apiError.detail };
  }

  return { title: apiError.message, description: apiError.detail };
};

export const fetchMyWorkflowTasks = async (
  client: ApiClient,
  query: Partial<WorkflowTaskQuery> = {},
): Promise<WorkflowTaskListResult> => {
  const result = await client.get<Partial<WorkflowTaskListResult>>(
    "/workflow/tasks/my",
    buildWorkflowTaskQuery(query),
  );
  const items = Array.isArray(result.items) ? result.items : [];

  return {
    items,
    total: typeof result.total === "number" ? result.total : items.length,
  };
};

export const fetchWorkflowTaskDetail = (
  client: ApiClient,
  taskId: string,
): Promise<WorkflowTask> => client.get<WorkflowTask>(`/workflow/tasks/${taskId}`);

export const approveWorkflowTask = (
  client: ApiClient,
  taskId: string,
  comment?: string,
): Promise<WorkflowTaskActionResult> =>
  client.post<WorkflowTaskActionResult>(
    `/workflow/tasks/${taskId}/approve`,
    buildApproveWorkflowTaskPayload(comment),
  );

export const rejectWorkflowTask = (
  client: ApiClient,
  taskId: string,
  comment: string,
): Promise<WorkflowTaskActionResult> => {
  const payload = buildRejectWorkflowTaskPayload(comment);

  if (!payload) {
    return Promise.reject({
      kind: "bad-request",
      message: "请填写驳回意见",
    } satisfies ApiError);
  }

  return client.post<WorkflowTaskActionResult>(`/workflow/tasks/${taskId}/reject`, payload);
};

type FeeReviewWorkflowTask = WorkflowTask & {
  stepCode: "FEE_REVIEW";
  instance: WorkflowTaskInstance & {
    targetType: "FEE_RECORD";
    targetId: string;
  };
};

export const isFeeReviewWorkflowTask = (
  task: WorkflowTask | null | undefined,
): task is FeeReviewWorkflowTask =>
  task?.stepCode === "FEE_REVIEW" &&
  task.instance?.targetType === "FEE_RECORD" &&
  Boolean(task.instance.targetId?.trim());

export const approveWorkflowTaskForTarget = (
  client: ApiClient,
  task: WorkflowTask,
  comment?: string,
): Promise<unknown> => {
  if (!isFeeReviewWorkflowTask(task)) {
    return approveWorkflowTask(client, task.id, comment);
  }

  const reason = comment?.trim();

  return client.post(
    `/fees/${task.instance.targetId.trim()}/review/approve`,
    reason ? { reason } : {},
  );
};

export const rejectWorkflowTaskForTarget = (
  client: ApiClient,
  task: WorkflowTask,
  comment: string,
): Promise<unknown> => {
  const payload = buildRejectWorkflowTaskPayload(comment);

  if (!payload) {
    return Promise.reject({
      kind: "bad-request",
      message: "Reject comment is required.",
    } satisfies ApiError);
  }

  if (!isFeeReviewWorkflowTask(task)) {
    return rejectWorkflowTask(client, task.id, comment);
  }

  return client.post(`/fees/${task.instance.targetId.trim()}/review/reject`, {
    reason: payload.comment,
  });
};

export const executeWorkflowTaskAction = (
  client: ApiClient,
  task: WorkflowTask,
  action: WorkflowActionKind,
  comment: string,
): Promise<unknown> =>
  action === "approve"
    ? approveWorkflowTaskForTarget(client, task, comment)
    : rejectWorkflowTaskForTarget(client, task, comment);

const normalizeWorkflowError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "请求失败",
    detail: error instanceof Error ? error.message : undefined,
  };
};

const formatDisplayValue = (value: string | null | undefined): string => value || "未返回";
