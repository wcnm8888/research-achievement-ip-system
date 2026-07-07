import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReadonlyAchievementDetail } from "./AchievementDetail";
import { createApiClient, isApiError, type ApiError, type AuthUser } from "./api-client";
import { BoundaryNotice, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type {
  ApproveWorkflowTaskPayload,
  RejectWorkflowTaskPayload,
  WorkflowActionKind,
  WorkflowTask,
  WorkflowTaskListResult,
  WorkflowTaskQuery,
} from "./types";
import {
  buildApproveWorkflowTaskPayload,
  buildRejectWorkflowTaskPayload,
  buildWorkflowTaskDetailDisplayModel,
  buildWorkflowTaskQuery,
  executeWorkflowTaskAction,
  fetchWorkflowTaskDetail,
  fetchMyWorkflowTasks,
  getWorkflowActionAvailability,
  getWorkflowInstanceStatusLabel,
  getWorkflowStepLabel,
  getWorkflowTaskLinkedAchievementId,
  getWorkflowTaskLinkedAchievementState,
  getWorkflowTargetTypeLabel,
  getWorkflowTaskStatusLabel,
  mapWorkflowErrorToDisplay,
  type WorkflowTaskLinkedAchievementState,
} from "./workflow-tasks";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type WorkflowTasksProps = {
  demoUserId: string | null;
  authUser?: WorkflowPermissionContext;
};

type WorkflowPermissionContext = Pick<AuthUser, "permissionCodes"> | null | undefined;

type WorkflowTaskFilters = {
  status?: WorkflowTaskQuery["status"];
  targetType?: WorkflowTaskQuery["targetType"];
  achievementId?: string;
  feeRecordId?: string;
};

export type WorkflowTaskListDisplayRow = {
  id: string;
  instanceId: string;
  stepLabel: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  targetTypeLabel: string;
  targetId: string;
  instanceStatusLabel: string;
  instanceStepLabel: string;
};

export type WorkflowTaskActionPresentation = {
  actions: WorkflowActionKind[];
  readonlyReason?: string;
};

export type WorkflowTaskDrawerViewModel = {
  actionPresentation: WorkflowTaskActionPresentation;
  detailFields: ReturnType<typeof buildWorkflowTaskDetailDisplayModel>;
  linkedAchievement: WorkflowTaskLinkedAchievementState;
  linkedAchievementId: string | null;
};

export type WorkflowTaskActionSubmission =
  | {
      valid: true;
      payload: ApproveWorkflowTaskPayload | RejectWorkflowTaskPayload | undefined;
    }
  | {
      valid: false;
      error: ApiError;
    };

export type WorkflowTaskActionDialogSnapshot = {
  activeAction: WorkflowActionKind;
  actionComment: string;
  selectedTaskId: string;
};

export type WorkflowTaskActionTransition = {
  activeAction: WorkflowActionKind | null;
  actionComment: string;
  actionError: ApiError | null;
  selectedTaskId: string | null;
  shouldRefreshList: boolean;
};

const defaultWorkflowTaskFilters: WorkflowTaskFilters = {
  status: "PENDING",
};

const statusOptions: Array<{ label: string; value: NonNullable<WorkflowTaskQuery["status"]> }> = [
  { label: "待处理", value: "PENDING" },
  { label: "已领取", value: "CLAIMED" },
  { label: "已通过", value: "APPROVED" },
  { label: "已驳回", value: "REJECTED" },
  { label: "已取消", value: "CANCELLED" },
];

const targetTypeOptions: Array<{
  label: string;
  value: NonNullable<WorkflowTaskQuery["targetType"]>;
}> = [
  { label: "Achievement", value: "ACHIEVEMENT" },
  { label: "Fee record", value: "FEE_RECORD" },
];

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

export function WorkflowTasks({ demoUserId, authUser }: WorkflowTasksProps) {
  const [draftFilters, setDraftFilters] =
    useState<WorkflowTaskFilters>(defaultWorkflowTaskFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<WorkflowTaskFilters>(defaultWorkflowTaskFilters);
  const [tasks, setTasks] = useState<Loadable<WorkflowTaskListResult>>(emptyLoadable);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<Loadable<WorkflowTask>>(emptyLoadable);
  const [activeAction, setActiveAction] = useState<WorkflowActionKind | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [acting, setActing] = useState(false);
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const query = useMemo(() => buildWorkflowTaskListQuery(appliedFilters), [appliedFilters]);

  const loadTasks = useCallback(async () => {
    if (!demoUserId) {
      setTasks(emptyLoadable);
      return;
    }

    setTasks({ loading: true, data: null, error: null });
    try {
      const data = await fetchMyWorkflowTasks(apiClient, query);
      setTasks({ loading: false, data, error: null });
    } catch (error) {
      setTasks({ loading: false, data: null, error: normalizeError(error) });
    }
  }, [apiClient, demoUserId, query]);

  const loadDetail = useCallback(
    async (taskId: string) => {
      if (!demoUserId) {
        setDetailState(emptyLoadable);
        return;
      }

      setDetailState({ loading: true, data: null, error: null });
      try {
        const detail = await fetchWorkflowTaskDetail(apiClient, taskId);
        setDetailState({ loading: false, data: detail, error: null });
      } catch (error) {
        setDetailState({ loading: false, data: null, error: normalizeError(error) });
      }
    },
    [apiClient, demoUserId],
  );

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!selectedTaskId) {
      setDetailState(emptyLoadable);
      return;
    }

    void loadDetail(selectedTaskId);
  }, [loadDetail, selectedTaskId]);

  useEffect(() => {
    if (!demoUserId) {
      setSelectedTaskId(null);
      setSelectedAchievementId(null);
      setDetailState(emptyLoadable);
      setActiveAction(null);
      setActionComment("");
      setActionError(null);
    }
  }, [demoUserId]);

  const applyFilters = () => {
    setAppliedFilters(trimWorkflowTaskFilters(draftFilters));
  };

  const resetFilters = () => {
    setDraftFilters(defaultWorkflowTaskFilters);
    setAppliedFilters(defaultWorkflowTaskFilters);
  };

  const openDetail = (taskId: string) => {
    if (!demoUserId) {
      return;
    }

    setSelectedTaskId(taskId);
    setSelectedAchievementId(null);
    setActiveAction(null);
    setActionComment("");
    setActionError(null);
  };

  const closeDetail = () => {
    if (acting) {
      return;
    }

    setSelectedTaskId(null);
    setSelectedAchievementId(null);
    setActiveAction(null);
    setActionComment("");
    setActionError(null);
  };

  const openAction = (action: WorkflowActionKind) => {
    setActiveAction(action);
    setActionComment("");
    setActionError(null);
  };

  const closeAction = () => {
    if (acting) {
      return;
    }

    setActiveAction(null);
    setActionComment("");
    setActionError(null);
  };

  const executeAction = async () => {
    const detail = detailState.data;

    if (!activeAction || !detail) {
      return;
    }

    const submission = buildWorkflowTaskActionSubmission(activeAction, actionComment);

    if (!submission.valid) {
      setActionError(submission.error);
      return;
    }

    setActing(true);
    setActionError(null);

    try {
      await executeWorkflowTaskAction(apiClient, detail, activeAction, actionComment);

      void message.success(getWorkflowActionSuccessMessage(activeAction));
      const nextState = buildWorkflowTaskActionSuccessTransition();
      setActiveAction(nextState.activeAction);
      setActionComment(nextState.actionComment);
      setActionError(nextState.actionError);
      setSelectedTaskId(nextState.selectedTaskId);
      setSelectedAchievementId(null);
      await loadTasks();
    } catch (error) {
      const nextState = buildWorkflowTaskActionFailureTransition(
        {
          activeAction,
          actionComment,
          selectedTaskId: detail.id,
        },
        error,
      );
      setActiveAction(nextState.activeAction);
      setActionComment(nextState.actionComment);
      setActionError(nextState.actionError);
      setSelectedTaskId(nextState.selectedTaskId);
    } finally {
      setActing(false);
    }
  };

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="审批管理"
          description="选择本地演示用户后，前端才会请求我的审批待办。"
        />
        <PermissionHint description="当前没有可用的业务用户，审批管理不会加载待办数据。请选择有审批权限的用户后继续。" />
        <BoundaryNotice
          title="等待演示上下文"
          description="选择演示用户后，本页可查看我的审批待办列表、任务详情，并在后端允许时执行通过或驳回。"
          step="审批管理"
        />
      </Space>
    );
  }

  const items = tasks.data?.items ?? [];
  const rows = items.map(buildWorkflowTaskListDisplayRow);
  const errorDisplay = tasks.error ? mapWorkflowErrorToDisplay(tasks.error) : null;
  const detailErrorDisplay = detailState.error
    ? mapWorkflowErrorToDisplay(detailState.error)
    : null;
  const actionErrorDisplay = actionError ? mapWorkflowErrorToDisplay(actionError) : null;
  const detailViewModel = detailState.data
    ? buildWorkflowTaskDrawerViewModel(detailState.data, authUser)
    : null;

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="审批管理"
        description="展示当前演示用户的审批待办。权限过滤、状态流转和可处理范围以后端为准。"
        extra={<Button onClick={() => void loadTasks()}>刷新</Button>}
      />
      <PermissionHint description="可在待办列表内查看单条任务详情，并在权限允许时执行通过或驳回。" />

      <Card className="shell-card">
        <Space className="workflow-filter-bar" size={12} wrap>
          <Select
            allowClear
            className="workflow-filter-select"
            placeholder="任务状态"
            options={statusOptions}
            value={draftFilters.status}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, status: value }))
            }
          />
          <Select
            allowClear
            className="workflow-filter-select"
            placeholder="目标类型"
            options={targetTypeOptions}
            value={draftFilters.targetType}
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                targetType: value,
                achievementId: value === "FEE_RECORD" ? undefined : current.achievementId,
                feeRecordId: value === "ACHIEVEMENT" ? undefined : current.feeRecordId,
              }))
            }
          />
          <Input.Search
            allowClear
            className="workflow-target-input"
            enterButton="查询"
            placeholder="按成果 ID 精确筛选"
            value={draftFilters.achievementId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                achievementId: event.target.value,
              }))
            }
            onSearch={applyFilters}
          />
          <Input.Search
            allowClear
            className="workflow-target-input"
            enterButton="筛选"
            placeholder="按费用记录 ID 筛选"
            value={draftFilters.feeRecordId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                feeRecordId: event.target.value,
              }))
            }
            onSearch={applyFilters}
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={() => void loadTasks()}>刷新</Button>
        </Space>
      </Card>

      <Card className="shell-card" title="我的待办列表">
        {tasks.loading ? (
          <div className="state-box">
            <Typography.Text type="secondary">正在加载审批待办...</Typography.Text>
          </div>
        ) : errorDisplay ? (
          <Result
            className="state-result"
            status={tasks.error?.kind === "forbidden" ? "403" : "warning"}
            title={errorDisplay.title}
            subTitle={errorDisplay.description}
            extra={
              <Button type="primary" onClick={() => void loadTasks()}>
                重试
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <div className="state-box">
            <Typography.Text type="secondary">当前没有匹配的审批待办</Typography.Text>
          </div>
        ) : (
          <Table<WorkflowTaskListDisplayRow>
            className="workflow-task-table"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1120 }}
            onRow={(row) => ({
              onClick: () => openDetail(row.id),
            })}
          />
        )}
      </Card>

      <Drawer
        className="workflow-task-detail-drawer"
        destroyOnClose
        extra={
          <WorkflowTaskDrawerActions
            detail={detailState.data}
            viewModel={detailViewModel}
            onClose={closeDetail}
            onOpenAction={openAction}
          />
        }
        open={Boolean(selectedTaskId)}
        title="审批待办详情"
        width="min(820px, 100vw)"
        onClose={closeDetail}
      >
        {detailState.loading ? (
          <div className="state-box">
            <Typography.Text type="secondary">正在加载审批待办详情...</Typography.Text>
          </div>
        ) : detailErrorDisplay ? (
          <Result
            className="state-result"
            status={detailState.error?.kind === "forbidden" ? "403" : "warning"}
            title={detailErrorDisplay.title}
            subTitle={detailErrorDisplay.description}
            extra={
              selectedTaskId ? (
                <Button type="primary" onClick={() => void loadDetail(selectedTaskId)}>
                  重试
                </Button>
              ) : null
            }
          />
        ) : detailState.data && detailViewModel ? (
          <WorkflowTaskDetailContent
            task={detailState.data}
            viewModel={detailViewModel}
            onOpenLinkedAchievement={setSelectedAchievementId}
          />
        ) : (
          <div className="state-box">
            <Typography.Text type="secondary">未返回审批待办详情</Typography.Text>
          </div>
        )}
      </Drawer>

      <Modal
        confirmLoading={acting}
        okButtonProps={{ danger: activeAction === "reject" }}
        okText={activeAction === "reject" ? "驳回" : "通过"}
        open={Boolean(activeAction)}
        title={activeAction === "reject" ? "确认驳回审批待办" : "确认通过审批待办"}
        onCancel={closeAction}
        onOk={() => void executeAction()}
      >
        <Space direction="vertical" size={12} className="full-width">
          <Typography.Paragraph>
            {activeAction === "reject"
              ? "驳回意见为必填，提交后最终状态流转以后端为准。"
              : "通过意见可选；空意见不会发送 comment 字段，最终状态流转以后端为准。"}
          </Typography.Paragraph>
          <Input.TextArea
            maxLength={1000}
            placeholder={activeAction === "reject" ? "请输入驳回意见" : "请输入审批意见（可选）"}
            rows={4}
            showCount
            status={
              activeAction === "reject" && actionError?.kind === "bad-request"
                ? "error"
                : undefined
            }
            value={actionComment}
            onChange={(event) => setActionComment(event.target.value)}
          />
          {actionErrorDisplay ? (
            <Alert
              showIcon
              type="error"
              message={actionErrorDisplay.title}
              description={actionErrorDisplay.description}
            />
          ) : null}
        </Space>
      </Modal>

      {selectedAchievementId ? (
        <ReadonlyAchievementDetail
          achievementId={selectedAchievementId}
          apiClient={apiClient}
          demoUserId={demoUserId}
          open
          onClose={() => setSelectedAchievementId(null)}
        />
      ) : null}
    </Space>
  );
}

export const buildWorkflowTaskListQuery = (
  filters: WorkflowTaskFilters,
): WorkflowTaskQuery => buildWorkflowTaskQuery(trimWorkflowTaskFilters(filters));

export const buildWorkflowTaskListDisplayRow = (
  task: WorkflowTask,
): WorkflowTaskListDisplayRow => ({
  id: task.id,
  instanceId: task.instanceId,
  stepLabel: getWorkflowStepLabel(task.stepCode),
  statusLabel: getWorkflowTaskStatusLabel(task.status),
  createdAt: formatDateTime(task.createdAt),
  updatedAt: formatDateTime(task.updatedAt),
  targetTypeLabel: task.instance
    ? getWorkflowTargetTypeLabel(task.instance.targetType)
    : "未返回",
  targetId: task.instance?.targetId || "未返回",
  instanceStatusLabel: task.instance
    ? getWorkflowInstanceStatusLabel(task.instance.status)
    : "未返回",
  instanceStepLabel: getWorkflowStepLabel(task.instance?.currentStep),
});

export const buildWorkflowTaskDrawerViewModel = (
  task: WorkflowTask,
  authUser?: WorkflowPermissionContext,
): WorkflowTaskDrawerViewModel => {
  const linkedAchievement = getWorkflowTaskLinkedAchievementState(task);

  return {
    detailFields: buildWorkflowTaskDetailDisplayModel(task),
    actionPresentation: getWorkflowTaskActionPresentation(task, authUser),
    linkedAchievement,
    linkedAchievementId: getWorkflowTaskLinkedAchievementId(task),
  };
};

export const canReviewDepartmentAchievements = (
  authUser: WorkflowPermissionContext,
): boolean => !authUser || authUser.permissionCodes.includes("achievement:review_department");

export const canReviewDepartmentFees = (
  authUser: WorkflowPermissionContext,
): boolean => !authUser || authUser.permissionCodes.includes("fee:review_department");

export const canReviewWorkflowTaskTarget = (
  task: WorkflowTask,
  authUser?: WorkflowPermissionContext,
): boolean => {
  if (task.instance?.targetType === "FEE_RECORD") {
    return canReviewDepartmentFees(authUser);
  }

  if (task.instance?.targetType === "ACHIEVEMENT") {
    return canReviewDepartmentAchievements(authUser);
  }

  return !authUser;
};

export const getWorkflowTaskActionPresentation = (
  task: WorkflowTask,
  authUser?: WorkflowPermissionContext,
): WorkflowTaskActionPresentation => {
  if (!canReviewWorkflowTaskTarget(task, authUser)) {
    return {
      actions: [],
      readonlyReason: "当前用户无审批处理权限",
    };
  }

  const availability = getWorkflowActionAvailability(task);

  if (availability.approve && availability.reject) {
    return {
      actions: ["approve", "reject"],
    };
  }

  return {
    actions: [],
    readonlyReason: availability.reason ?? "当前待办不可处理",
  };
};

export const buildWorkflowTaskActionSubmission = (
  action: WorkflowActionKind,
  comment: string,
): WorkflowTaskActionSubmission => {
  if (action === "approve") {
    return {
      valid: true,
      payload: buildApproveWorkflowTaskPayload(comment),
    };
  }

  const payload = buildRejectWorkflowTaskPayload(comment);

  if (!payload) {
    return {
      valid: false,
      error: {
        kind: "bad-request",
        message: "请填写驳回意见",
      },
    };
  }

  return {
    valid: true,
    payload,
  };
};

export const buildWorkflowTaskActionSuccessTransition =
  (): WorkflowTaskActionTransition => ({
    activeAction: null,
    actionComment: "",
    actionError: null,
    selectedTaskId: null,
    shouldRefreshList: true,
  });

export const buildWorkflowTaskActionFailureTransition = (
  current: WorkflowTaskActionDialogSnapshot,
  error: unknown,
): WorkflowTaskActionTransition => ({
  activeAction: current.activeAction,
  actionComment: current.actionComment,
  actionError: normalizeError(error),
  selectedTaskId: current.selectedTaskId,
  shouldRefreshList: false,
});

export const getWorkflowActionSuccessMessage = (action: WorkflowActionKind): string =>
  action === "approve" ? "审批已通过" : "审批已驳回";

export const getWorkbenchWorkflowNavKey = (): "workflow" => "workflow";

const trimWorkflowTaskFilters = (filters: WorkflowTaskFilters): WorkflowTaskFilters => ({
  status: filters.status,
  targetType: filters.targetType,
  achievementId: filters.achievementId?.trim() || undefined,
  feeRecordId: filters.feeRecordId?.trim() || undefined,
});

function WorkflowTaskDrawerActions({
  detail,
  viewModel,
  onClose,
  onOpenAction,
}: {
  detail: WorkflowTask | null;
  viewModel: WorkflowTaskDrawerViewModel | null;
  onClose: () => void;
  onOpenAction: (action: WorkflowActionKind) => void;
}) {
  if (!detail || !viewModel) {
    return <Button onClick={onClose}>关闭</Button>;
  }

  return (
    <Space wrap>
      {viewModel.actionPresentation.actions.includes("approve") ? (
        <Button type="primary" onClick={() => onOpenAction("approve")}>
          通过
        </Button>
      ) : null}
      {viewModel.actionPresentation.actions.includes("reject") ? (
        <Button danger onClick={() => onOpenAction("reject")}>
          驳回
        </Button>
      ) : null}
      <Button onClick={onClose}>关闭</Button>
    </Space>
  );
}

function WorkflowTaskDetailContent({
  task,
  viewModel,
  onOpenLinkedAchievement,
}: {
  task: WorkflowTask;
  viewModel: WorkflowTaskDrawerViewModel;
  onOpenLinkedAchievement: (achievementId: string) => void;
}) {
  return (
    <Space direction="vertical" size={16} className="full-width">
      <PermissionHint description="前端只做可处理状态的体验保护；任务读取、权限判断和状态流转最终以后端为准。" />

      {viewModel.actionPresentation.readonlyReason ? (
        <Alert
          showIcon
          type="info"
          message="当前待办不可处理"
          description={viewModel.actionPresentation.readonlyReason}
        />
      ) : (
        <Alert
          showIcon
          type="success"
          message="当前待办可处理"
          description="可在本抽屉中执行通过或驳回；提交结果仍以后端权限和状态机为准。"
        />
      )}

      <Divider orientation="left">任务字段</Divider>
      <Descriptions bordered column={2} size="small">
        {viewModel.detailFields.taskFields.map((field) => (
          <Descriptions.Item key={field.label} label={field.label}>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Divider orientation="left">流程实例字段</Divider>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="流程实例 ID">{task.instanceId}</Descriptions.Item>
        {viewModel.detailFields.instanceFields.map((field) => (
          <Descriptions.Item key={field.label} label={field.label}>
            {field.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      {!viewModel.linkedAchievement.available ? (
        <>
          <Divider orientation="left">关联成果</Divider>
          <Alert
            className="workflow-linked-achievement-alert"
            showIcon
            type="warning"
            message={viewModel.linkedAchievement.message}
            description={viewModel.linkedAchievement.description}
          />
        </>
      ) : null}

      {viewModel.linkedAchievementId ? (
        <>
          <Divider orientation="left">关联成果</Divider>
          <Alert
            showIcon
            type="info"
            message="可查看关联科研成果"
            description="审批上下文仅提供成果详情只读查看，不提供提交、作废或归档动作。"
            action={
              <Button
                type="primary"
                onClick={() => onOpenLinkedAchievement(viewModel.linkedAchievementId!)}
              >
                查看关联成果
              </Button>
            }
          />
        </>
      ) : null}

      <Alert
        showIcon
        type="warning"
        message="操作边界"
        description="本抽屉仅提供关联成果只读入口，不展示审批历史或审计日志。"
      />
    </Space>
  );
}

const columns: TableProps<WorkflowTaskListDisplayRow>["columns"] = [
  {
    title: "任务",
    key: "task",
    width: 260,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{row.stepLabel}</Typography.Text>
        <Typography.Text type="secondary" ellipsis>
          {row.id}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: "状态",
    dataIndex: "statusLabel",
    key: "statusLabel",
    width: 120,
    render: (value: string) => <Tag>{value}</Tag>,
  },
  {
    title: "目标",
    key: "target",
    width: 280,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{row.targetTypeLabel}</Typography.Text>
        <Typography.Text type="secondary" ellipsis>
          {row.targetId}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: "流程实例",
    key: "instance",
    width: 260,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{row.instanceStatusLabel}</Typography.Text>
        <Typography.Text type="secondary" ellipsis>
          {row.instanceId}
        </Typography.Text>
        <Typography.Text type="secondary">当前步骤：{row.instanceStepLabel}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 176,
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 176,
  },
];

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "请求失败",
    detail: error instanceof Error ? error.message : undefined,
  };
};

const formatDateTime = (value: string | undefined): string => {
  if (!value) {
    return "未返回";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
