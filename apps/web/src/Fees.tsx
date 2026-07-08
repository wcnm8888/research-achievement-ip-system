import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildAchievementAttachmentFormData,
  buildAttachmentMetadataViewModel,
  formatAttachmentSize,
  getAttachmentDownloadFileName,
  mapAttachmentDownloadErrorToDisplay,
  mapAttachmentMetadataErrorToDisplay,
  mapAttachmentPreviewErrorToDisplay,
  mapAttachmentUploadErrorToDisplay,
  saveAttachmentBlob,
  validateAttachmentUploadFile,
} from "./AchievementDetail";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";
import {
  createApiClient,
  isApiError,
  type ApiClient,
  type ApiError,
  type ApiQuery,
  type AuthUser,
} from "./api-client";
import {
  createAttachmentPreviewObjectUrl,
  downloadAttachmentPreviewBlob,
  isPreviewableAttachment,
  revokeAttachmentPreviewObjectUrl,
} from "./attachment-preview";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { downloadCsvExport, downloadXlsxExport } from "./export-download";
import type {
  ApproveFeeReviewInput,
  AttachmentDetailMetadata,
  AttachmentListQuery,
  AttachmentMetadata,
  ChangeFeeStatusInput,
  CreateFeeRecordInput,
  FeeQuery,
  FeeRecord,
  FeeReviewHistoryActionCode,
  FeeReviewHistoryEntry,
  FeeReviewStatusCode,
  FeeStateRecord,
  FeeTypeCode,
  FundSourceCode,
  MarkFeePaidInput,
  PayStatusCode,
  RejectFeeReviewInput,
  SecretLevelCode,
  UploadFeeVoucherAttachmentInput,
  WorkflowTask,
  WorkflowTaskStatusCode,
} from "./types";
import {
  fetchMyWorkflowTasks,
  getWorkflowInstanceStatusLabel,
  getWorkflowStepLabel,
  getWorkflowTargetTypeLabel,
  getWorkflowTaskStatusLabel,
} from "./workflow-tasks";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type AttachmentPreviewState = {
  attachmentId: string | null;
  error: ApiError | null;
  fileName: string;
  loading: boolean;
  mimeType: string | null;
  open: boolean;
  previewUrl: string | null;
};

type FeesProps = {
  demoUserId: string | null;
  authUser?: FeePermissionContext;
};

type FeePermissionContext = Pick<AuthUser, "permissionCodes"> | null | undefined;

type FeeFilters = {
  achievementId?: string;
  feeType?: FeeTypeCode;
  payStatus?: PayStatusCode;
};

type FeeExportField =
  | "id"
  | "achievementId"
  | "departmentId"
  | "feeType"
  | "fundSource"
  | "amount"
  | "dueDate"
  | "paidDate"
  | "payStatus"
  | "voucherNo"
  | "reviewStatus"
  | "reviewedAt"
  | "createdAt"
  | "updatedAt"
  | "archivedAt";

export type CreateFeeFormValues = {
  achievementId: string;
  feeType?: FeeTypeCode;
  fundSource?: FundSourceCode;
  amount: string;
  dueDate: string;
  voucherNo: string;
};

export type MarkFeePaidFormValues = {
  paidDate: string;
  voucherNo: string;
};

export type FeeStatusActionKind = "waive" | "cancel";

export type FeeReviewActionKind = "approve" | "reject";

export type FeeStatusActionFormValues = {
  reason: string;
};

export type FeeReviewActionFormValues = {
  reason: string;
};

export type CreateFeeFormErrors = Partial<Record<keyof CreateFeeFormValues, string>>;

export type MarkFeePaidFormErrors = Partial<Record<keyof MarkFeePaidFormValues, string>>;

export type FeeStatusActionFormErrors = Partial<Record<keyof FeeStatusActionFormValues, string>>;

export type FeeReviewActionFormErrors = Partial<Record<keyof FeeReviewActionFormValues, string>>;

type MutationState = {
  loading: boolean;
  error: ApiError | null;
  successMessage: string | null;
};

export type FeeWarningSummary = {
  total: number;
  overdue: number;
  dueSoon: number;
  paid: number;
  pending: number;
};

export type FeeListStateKind = "loading" | "error" | "empty" | "ready";

export type FeeDetailStateKind = "loading" | "error" | "empty" | "ready";

export type FeeReviewHistoryStateKind = "loading" | "error" | "empty" | "ready";

export type FeeWarningGroupKey = "overdue" | "dueSoon" | "pendingLater" | "terminal";

export type FeeWarningGroup = {
  key: FeeWarningGroupKey;
  title: string;
  description: string;
  records: FeeRecord[];
  color: string;
};

export type FeeWarningClassification = {
  key: FeeWarningGroupKey;
  record: FeeRecord;
};

type FeeDetailContentMode = "management" | "search-readonly";

const defaultTake = 100;
const feeVoucherAttachmentDefaultTake = 50;
const dueSoonDays = 30;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const feeVoucherAttachmentBoundary = {
  title: "凭证附件",
  description:
    "可在费用详情中查看和维护当前记录关联的凭证附件。",
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const emptyAttachmentPreviewState = (): AttachmentPreviewState => ({
  attachmentId: null,
  error: null,
  fileName: "",
  loading: false,
  mimeType: null,
  open: false,
  previewUrl: null,
});

const emptyMutationState = (): MutationState => ({
  loading: false,
  error: null,
  successMessage: null,
});

const feeTypeOptions: Array<{ label: string; value: FeeTypeCode }> = [
  { label: "专利申请费", value: "PATENT_APPLICATION" },
  { label: "专利年费", value: "PATENT_ANNUAL" },
  { label: "软著费用", value: "SOFTWARE_COPYRIGHT" },
  { label: "代理服务费", value: "AGENCY" },
  { label: "其他费用", value: "OTHER" },
];

const payStatusOptions: Array<{ label: string; value: PayStatusCode }> = [
  { label: "待缴", value: "PENDING" },
  { label: "逾期", value: "OVERDUE" },
  { label: "已缴", value: "PAID" },
  { label: "已减免", value: "WAIVED" },
  { label: "已取消", value: "CANCELLED" },
];

const fundSourceOptions: Array<{ label: string; value: FundSourceCode }> = [
  { label: "项目经费", value: "PROJECT" },
  { label: "部门经费", value: "DEPARTMENT" },
  { label: "院级经费", value: "INSTITUTE" },
  { label: "其他来源", value: "OTHER" },
];

const feeTypeLabels = Object.fromEntries(
  feeTypeOptions.map((option) => [option.value, option.label]),
) as Record<FeeTypeCode, string>;

const payStatusLabels = Object.fromEntries(
  payStatusOptions.map((option) => [option.value, option.label]),
) as Record<PayStatusCode, string>;

const payStatusColors: Record<PayStatusCode, string> = {
  PENDING: "processing",
  OVERDUE: "error",
  PAID: "success",
  WAIVED: "default",
  CANCELLED: "default",
};

const reviewStatusOptions: Array<{ label: string; value: FeeReviewStatusCode }> = [
  { label: "待审核", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "已拒绝", value: "REJECTED" },
];

const feeExportFieldOptions: Array<{ label: string; value: FeeExportField }> = [
  { label: "ID", value: "id" },
  { label: "成果 ID", value: "achievementId" },
  { label: "部门 ID", value: "departmentId" },
  { label: "费用类型", value: "feeType" },
  { label: "经费来源", value: "fundSource" },
  { label: "金额", value: "amount" },
  { label: "应缴日期", value: "dueDate" },
  { label: "缴费日期", value: "paidDate" },
  { label: "缴费状态", value: "payStatus" },
  { label: "凭证号", value: "voucherNo" },
  { label: "审核状态", value: "reviewStatus" },
  { label: "审核时间", value: "reviewedAt" },
  { label: "创建时间", value: "createdAt" },
  { label: "更新时间", value: "updatedAt" },
  { label: "归档时间", value: "archivedAt" },
];

const defaultFeeExportFields = feeExportFieldOptions.map((option) => option.value);

const reviewStatusLabels = Object.fromEntries(
  reviewStatusOptions.map((option) => [option.value, option.label]),
) as Record<FeeReviewStatusCode, string>;

const reviewStatusColors: Record<FeeReviewStatusCode, string> = {
  PENDING: "processing",
  APPROVED: "success",
  REJECTED: "error",
};

const reviewHistoryActionLabels: Record<FeeReviewHistoryActionCode, string> = {
  APPROVE: "审核通过",
  REJECT: "审核拒绝",
};

const reviewHistoryActionColors: Record<FeeReviewHistoryActionCode, string> = {
  APPROVE: "success",
  REJECT: "error",
};

export function Fees({ demoUserId, authUser }: FeesProps) {
  const [draftFilters, setDraftFilters] = useState<FeeFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<FeeFilters>({});
  const [fees, setFees] = useState<Loadable<FeeRecord[]>>(emptyLoadable);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [feeDetail, setFeeDetail] = useState<Loadable<FeeRecord>>(emptyLoadable);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFeeFormValues>(createDefaultFeeForm);
  const [createErrors, setCreateErrors] = useState<CreateFeeFormErrors>({});
  const [createStatus, setCreateStatus] = useState<MutationState>(emptyMutationState);
  const [markPaidRecord, setMarkPaidRecord] = useState<FeeRecord | null>(null);
  const [markPaidForm, setMarkPaidForm] = useState<MarkFeePaidFormValues>(
    createDefaultMarkPaidForm,
  );
  const [markPaidErrors, setMarkPaidErrors] = useState<MarkFeePaidFormErrors>({});
  const [markPaidStatus, setMarkPaidStatus] = useState<MutationState>(emptyMutationState);
  const [statusAction, setStatusAction] = useState<{
    kind: FeeStatusActionKind;
    record: FeeRecord;
  } | null>(null);
  const [statusActionForm, setStatusActionForm] = useState<FeeStatusActionFormValues>(
    createDefaultFeeStatusActionForm,
  );
  const [statusActionErrors, setStatusActionErrors] = useState<FeeStatusActionFormErrors>({});
  const [statusActionStatus, setStatusActionStatus] = useState<MutationState>(emptyMutationState);
  const [reviewAction, setReviewAction] = useState<{
    kind: FeeReviewActionKind;
    record: FeeRecord;
  } | null>(null);
  const [reviewActionForm, setReviewActionForm] = useState<FeeReviewActionFormValues>(
    createDefaultFeeReviewActionForm,
  );
  const [reviewActionErrors, setReviewActionErrors] = useState<FeeReviewActionFormErrors>({});
  const [reviewActionStatus, setReviewActionStatus] = useState<MutationState>(emptyMutationState);
  const [reviewHistoryRefreshVersion, setReviewHistoryRefreshVersion] = useState(0);
  const [reviewTaskRefreshVersion, setReviewTaskRefreshVersion] = useState(0);
  const [exportState, setExportState] = useState<{ loading: boolean; error: ApiError | null }>({
    loading: false,
    error: null,
  });
  const [exportFields, setExportFields] = useState<FeeExportField[]>(
    defaultFeeExportFields,
  );
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const query = useMemo(() => buildFeeQuery(appliedFilters), [appliedFilters]);
  const canManageFees = canManageDepartmentFees(authUser);
  const canReviewFees = canReviewDepartmentFees(authUser);

  const loadFees = useCallback(() => {
    if (!demoUserId) {
      setFees(emptyLoadable);
      return;
    }

    setFees({ loading: true, data: null, error: null });
    void fetchFeeRecords(apiClient, query)
      .then((data) => setFees({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setFees({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, demoUserId, query]);

  const loadFeeDetail = useCallback(
    (feeRecordId: string) => {
      if (!demoUserId || !feeRecordId.trim()) {
        setFeeDetail(emptyLoadable);
        return;
      }

      setFeeDetail({ loading: true, data: null, error: null });
      void loadFeeDetailForDemoUser(apiClient, demoUserId, feeRecordId)
        .then((data) => setFeeDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setFeeDetail({
            loading: false,
            data: null,
            error: mapFeeDetailErrorToDisplay(normalizeError(error)),
          }),
        );
    },
    [apiClient, demoUserId],
  );

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  useEffect(() => {
    if (!demoUserId || !selectedFeeId) {
      setFeeDetail(emptyLoadable);
      return;
    }

    loadFeeDetail(selectedFeeId);
  }, [demoUserId, loadFeeDetail, selectedFeeId]);

  const applyFilters = () => {
    setAppliedFilters(trimFeeFilters(draftFilters));
  };

  const resetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
  };

  const exportLedger = (format: FeeExportFormat) => {
    setExportState({ loading: true, error: null });
    void exportFeeLedger(apiClient, appliedFilters, format, exportFields)
      .then(() => setExportState({ loading: false, error: null }))
      .catch((error: unknown) =>
        setExportState({ loading: false, error: normalizeError(error) }),
      );
  };

  const openFeeDetail = useCallback((record: FeeRecord) => {
    setSelectedFeeId(buildFeeDetailOpenRequest(record));
  }, []);

  const closeFeeDetail = () => {
    setSelectedFeeId(null);
  };

  const retryFeeDetail = () => {
    if (selectedFeeId) {
      loadFeeDetail(selectedFeeId);
    }
  };

  const openCreateDrawer = () => {
    setCreateDrawerOpen(true);
    setCreateErrors({});
    setCreateStatus(emptyMutationState());
  };

  const closeCreateDrawer = () => {
    setCreateDrawerOpen(false);
    setCreateErrors({});
    setCreateStatus(emptyMutationState());
  };

  const openMarkPaidDrawer = useCallback((record: FeeRecord) => {
    setMarkPaidRecord(record);
    setMarkPaidForm(createDefaultMarkPaidForm());
    setMarkPaidErrors({});
    setMarkPaidStatus(emptyMutationState());
  }, []);

  const closeMarkPaidDrawer = () => {
    setMarkPaidRecord(null);
    setMarkPaidErrors({});
    setMarkPaidStatus(emptyMutationState());
  };

  const openStatusActionDrawer = useCallback((kind: FeeStatusActionKind, record: FeeRecord) => {
    setStatusAction({ kind, record });
    setStatusActionForm(createDefaultFeeStatusActionForm());
    setStatusActionErrors({});
    setStatusActionStatus(emptyMutationState());
  }, []);

  const closeStatusActionDrawer = () => {
    setStatusAction(null);
    setStatusActionErrors({});
    setStatusActionStatus(emptyMutationState());
  };

  const openReviewActionDrawer = useCallback((kind: FeeReviewActionKind, record: FeeRecord) => {
    setReviewAction({ kind, record });
    setReviewActionForm(createDefaultFeeReviewActionForm());
    setReviewActionErrors({});
    setReviewActionStatus(emptyMutationState());
  }, []);

  const closeReviewActionDrawer = () => {
    setReviewAction(null);
    setReviewActionErrors({});
    setReviewActionStatus(emptyMutationState());
  };

  const submitCreateFee = () => {
    if (!canManageFees) {
      return;
    }

    const result = buildCreateFeeRecordPayload(createForm);
    setCreateErrors(result.errors);

    if (!result.payload) {
      return;
    }

    setCreateStatus({ loading: true, error: null, successMessage: null });
    void createFeeRecordForDemoUser(apiClient, demoUserId, result.payload)
      .then((created) => {
        if (!created) {
          setCreateStatus({
            loading: false,
            error: mapFeeMutationErrorToDisplay({
              kind: "unauthorized",
              message: "请选择业务用户后再创建费用",
            }),
            successMessage: null,
          });
          return;
        }

        setCreateStatus({
          loading: false,
          error: null,
          successMessage: "费用记录已创建。列表、预警分组和详情会刷新。",
        });
        setCreateForm(createDefaultFeeForm());
        setSelectedFeeId(created.id);
        loadFees();
      })
      .catch((error: unknown) =>
        setCreateStatus({
          loading: false,
          error: mapFeeMutationErrorToDisplay(normalizeError(error)),
          successMessage: null,
        }),
      );
  };

  const submitMarkPaid = () => {
    if (!canManageFees || !markPaidRecord) {
      return;
    }

    const result = buildMarkFeePaidPayload(markPaidForm);
    setMarkPaidErrors(result.errors);

    if (!result.payload) {
      return;
    }

    setMarkPaidStatus({ loading: true, error: null, successMessage: null });
    void markFeePaidForDemoUser(apiClient, demoUserId, markPaidRecord.id, result.payload)
      .then((updated) => {
        if (!updated) {
          setMarkPaidStatus({
            loading: false,
            error: mapFeeMutationErrorToDisplay({
              kind: "unauthorized",
              message: "请选择业务用户后再标记缴费",
            }),
            successMessage: null,
          });
          return;
        }

        setMarkPaidStatus({
          loading: false,
          error: null,
          successMessage: "费用已标记为已缴。列表、预警分组和当前详情会刷新。",
        });
        loadFees();
        loadFeeDetail(markPaidRecord.id);
      })
      .catch((error: unknown) =>
        setMarkPaidStatus({
          loading: false,
          error: mapFeeMutationErrorToDisplay(normalizeError(error)),
          successMessage: null,
        }),
      );
  };

  const submitStatusAction = () => {
    if (!canManageFees || !statusAction || !canWaiveOrCancelFee(statusAction.record)) {
      return;
    }

    const result = buildFeeStatusActionPayload(statusActionForm);
    setStatusActionErrors(result.errors);

    if (!result.payload) {
      return;
    }

    setStatusActionStatus({ loading: true, error: null, successMessage: null });
    const actionRequest =
      statusAction.kind === "waive"
        ? waiveFeeForDemoUser(apiClient, demoUserId, statusAction.record.id, result.payload)
        : cancelFeeForDemoUser(apiClient, demoUserId, statusAction.record.id, result.payload);

    void actionRequest
      .then((updated) => {
        if (!updated) {
          setStatusActionStatus({
            loading: false,
            error: mapFeeMutationErrorToDisplay({
              kind: "unauthorized",
              message: "请选择业务用户后再变更费用状态",
            }),
            successMessage: null,
          });
          return;
        }

        setStatusActionStatus({
          loading: false,
          error: null,
          successMessage:
            statusAction.kind === "waive"
              ? "费用已减免。列表、预警分组和当前详情会刷新。"
              : "费用已取消。列表、预警分组和当前详情会刷新。",
        });
        loadFees();
        loadFeeDetail(statusAction.record.id);
      })
      .catch((error: unknown) =>
        setStatusActionStatus({
          loading: false,
          error: mapFeeMutationErrorToDisplay(normalizeError(error)),
          successMessage: null,
        }),
      );
  };

  const submitReviewAction = () => {
    if (!canReviewFees || !reviewAction || !canReviewFee(reviewAction.record)) {
      return;
    }

    const result = buildFeeReviewActionPayload(reviewAction.kind, reviewActionForm);
    setReviewActionErrors(result.errors);

    if (!result.payload) {
      return;
    }

    setReviewActionStatus({ loading: true, error: null, successMessage: null });
    const actionRequest =
      reviewAction.kind === "approve"
        ? approveFeeReviewForDemoUser(
            apiClient,
            demoUserId,
            reviewAction.record.id,
            result.payload,
          )
        : rejectFeeReviewForDemoUser(
            apiClient,
            demoUserId,
            reviewAction.record.id,
            result.payload as RejectFeeReviewInput,
          );

    void actionRequest
      .then((updated) => {
        if (!updated) {
          setReviewActionStatus({
            loading: false,
            error: mapFeeMutationErrorToDisplay({
              kind: "unauthorized",
              message: "请选择业务用户后再执行费用审核",
            }),
            successMessage: null,
          });
          return;
        }

        setReviewActionStatus({
          loading: false,
          error: null,
          successMessage:
            reviewAction.kind === "approve"
              ? "费用审核已通过。列表和当前详情会刷新。"
              : "费用审核已拒绝。列表和当前详情会刷新。",
        });
        setReviewHistoryRefreshVersion((current) => current + 1);
        setReviewTaskRefreshVersion((current) => current + 1);
        loadFees();
        loadFeeDetail(reviewAction.record.id);
      })
      .catch((error: unknown) =>
        setReviewActionStatus({
          loading: false,
          error: mapFeeMutationErrorToDisplay(normalizeError(error)),
          successMessage: null,
        }),
      );
  };

  const columns = useMemo(
    () =>
      buildFeeColumns(
        openFeeDetail,
        openMarkPaidDrawer,
        openStatusActionDrawer,
        openReviewActionDrawer,
        canManageFees,
        false,
      ),
    [
      canManageFees,
      openFeeDetail,
      openMarkPaidDrawer,
      openReviewActionDrawer,
      openStatusActionDrawer,
    ],
  );

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="费用管理"
          description="请选择业务用户后查看费用台账。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，费用管理不会加载业务数据。请选择具备费用权限的用户后继续。"
        />
        <BoundaryNotice
          title="请选择业务用户"
          description="选择具备费用权限的用户后即可查看费用台账。"
          step="费用管理"
        />
      </Space>
    );
  }

  const items = fees.data ?? [];
  const summary = deriveFeeWarningSummary(items);
  const warningGroups = groupFeeWarnings(items);
  const hasFilters = hasActiveFilters(appliedFilters);
  const listState = getFeeListState(fees, hasFilters);

  return (
    <Space direction="vertical" size={16} className="page-stack fee-page">
      <SectionHeader
        title="费用管理"
        description="集中查看知识产权相关费用、缴费风险、凭证附件和审核处理状态。"
        extra={
          <Space wrap>
            {canManageFees ? (
              <Button type="primary" onClick={openCreateDrawer}>
                新增费用
              </Button>
            ) : null}
            <Button onClick={loadFees}>刷新</Button>
          </Space>
        }
      />
      <PermissionHint description="当前账号可查看费用台账、凭证附件和预警摘要。" />
      {exportState.error ? (
        <Typography.Text type="danger">{exportState.error.message}</Typography.Text>
      ) : null}

      <Card className="shell-card risk-summary-card" title="费用风险摘要" extra={<Tag>当前列表口径</Tag>}>
        <Row gutter={[16, 16]}>
          <Col xs={12} lg={6}>
            <Statistic title="当前列表" value={summary.total} suffix="条" />
          </Col>
          <Col xs={12} lg={6}>
            <Statistic
              title="逾期风险"
              value={summary.overdue}
              valueStyle={{ color: summary.overdue > 0 ? "#b42318" : undefined }}
            />
          </Col>
          <Col xs={12} lg={6}>
            <Statistic title="30天内到期" value={summary.dueSoon} />
          </Col>
          <Col xs={12} lg={6}>
            <Statistic title="已缴记录" value={summary.paid} />
          </Col>
        </Row>
        <Typography.Paragraph type="secondary" className="card-note">
          摘要基于当前权限范围内的费用列表计算：待缴或逾期状态会参与风险判断，已缴、已减免、已取消不作为到期风险。
        </Typography.Paragraph>
      </Card>

      <Card className="shell-card warning-groups-card" title="预警分组" extra={<Tag>按到期状态</Tag>}>
        <Typography.Paragraph type="secondary" className="card-note">
          分组基于当前费用列表的截止日期和缴费状态计算。
        </Typography.Paragraph>
        <div className="fee-warning-groups">
          {warningGroups.map((group) => (
            <section className="fee-warning-group" key={group.key}>
              <Space direction="vertical" size={8} className="full-width">
                <Space align="center" className="fee-warning-group-title">
                  <Tag color={group.color}>{group.records.length}</Tag>
                  <Typography.Text strong>{group.title}</Typography.Text>
                </Space>
                <Typography.Text type="secondary">{group.description}</Typography.Text>
                {group.records.length > 0 ? (
                  <Space direction="vertical" size={4} className="fee-warning-list">
                    {group.records.slice(0, 5).map((record) => (
                      <button
                        className="fee-warning-item"
                        key={record.id}
                        type="button"
                        onClick={() => openFeeDetail(record)}
                      >
                        <span>{getFeeTypeLabel(record.feeType)}</span>
                        <span>{formatDate(record.dueDate)}</span>
                        <span>{getPayStatusLabel(record.payStatus)}</span>
                      </button>
                    ))}
                    {group.records.length > 5 ? (
                      <Typography.Text type="secondary">
                        另有 {group.records.length - 5} 条记录，可在台账中继续查看。
                      </Typography.Text>
                    ) : null}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">当前列表暂无此类记录。</Typography.Text>
                )}
              </Space>
            </section>
          ))}
        </div>
      </Card>

      <Card className="shell-card toolbar-card fee-toolbar-card" title="筛选与导出" extra={<Tag>费用台账</Tag>}>
        <Space className="fee-filter-bar" size={12} wrap>
          <Select
            allowClear
            className="fee-filter-select"
            placeholder="缴费状态"
            options={payStatusOptions}
            value={draftFilters.payStatus}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, payStatus: value }))
            }
          />
          <Select
            allowClear
            className="fee-filter-select"
            placeholder="费用类型"
            options={feeTypeOptions}
            value={draftFilters.feeType}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, feeType: value }))
            }
          />
          <Input.Search
            allowClear
            className="fee-achievement-input"
            enterButton="查询"
            placeholder="按成果标识精确筛选"
            value={draftFilters.achievementId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                achievementId: event.target.value,
              }))
            }
            onSearch={applyFilters}
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadFees}>刷新</Button>
          <Select<FeeExportField[]>
            mode="multiple"
            className="fee-filter-select"
            placeholder="导出字段"
            maxTagCount="responsive"
            options={feeExportFieldOptions}
            value={exportFields}
            onChange={(value) => setExportFields(value.length > 0 ? value : defaultFeeExportFields)}
          />
          <Button onClick={() => exportLedger("csv")} loading={exportState.loading}>
            导出 CSV
          </Button>
          <Button onClick={() => exportLedger("xlsx")} loading={exportState.loading}>
            导出 Excel
          </Button>
        </Space>
      </Card>

      <Card
        className="shell-card ledger-card"
        title="费用台账"
        extra={<Tag color={items.length > 0 ? "blue" : "default"}>当前 {items.length} 条</Tag>}
      >
        <DataState
          loading={fees.loading}
          error={fees.error}
          empty={listState.kind === "empty"}
          emptyText={listState.emptyText}
          onRetry={loadFees}
        >
          <Table<FeeRecord>
            className="fee-table"
            rowKey="id"
            columns={columns}
            dataSource={items}
            pagination={{
              pageSize: 20,
              showSizeChanger: false,
              showTotal: (total) => `当前返回 ${total} 条`,
            }}
            scroll={{ x: 1248 }}
          />
        </DataState>
      </Card>

      <BoundaryNotice
        title={feeVoucherAttachmentBoundary.title}
        description={feeVoucherAttachmentBoundary.description}
        step="费用凭证"
      />
      <FeeDetailDrawer
        apiClient={apiClient}
        authUser={authUser}
        detail={feeDetail}
        demoUserId={demoUserId}
        feeRecordId={selectedFeeId}
        canManageFees={canManageFees}
        canReviewFees={canReviewFees}
        reviewHistoryRefreshVersion={reviewHistoryRefreshVersion}
        reviewTaskRefreshVersion={reviewTaskRefreshVersion}
        onOpenMarkPaid={openMarkPaidDrawer}
        onOpenStatusAction={openStatusActionDrawer}
        onOpenReviewAction={openReviewActionDrawer}
        onClose={closeFeeDetail}
        onRetry={retryFeeDetail}
      />
      <CreateFeeDrawer
        open={createDrawerOpen}
        values={createForm}
        errors={createErrors}
        status={createStatus}
        onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
        onClose={closeCreateDrawer}
        onSubmit={submitCreateFee}
      />
      <MarkFeePaidDrawer
        record={markPaidRecord}
        values={markPaidForm}
        errors={markPaidErrors}
        status={markPaidStatus}
        canManageFees={canManageFees}
        onChange={(patch) => setMarkPaidForm((current) => ({ ...current, ...patch }))}
        onClose={closeMarkPaidDrawer}
        onSubmit={submitMarkPaid}
      />
      <FeeStatusActionDrawer
        action={statusAction}
        values={statusActionForm}
        errors={statusActionErrors}
        status={statusActionStatus}
        canManageFees={canManageFees}
        onChange={(patch) => setStatusActionForm((current) => ({ ...current, ...patch }))}
        onClose={closeStatusActionDrawer}
        onSubmit={submitStatusAction}
      />
      <FeeReviewActionDrawer
        action={reviewAction}
        values={reviewActionForm}
        errors={reviewActionErrors}
        status={reviewActionStatus}
        canReviewFees={canReviewFees}
        onChange={(patch) => setReviewActionForm((current) => ({ ...current, ...patch }))}
        onClose={closeReviewActionDrawer}
        onSubmit={submitReviewAction}
      />
    </Space>
  );
}

function FeeDetailDrawer({
  apiClient,
  authUser,
  detail,
  demoUserId,
  feeRecordId,
  canManageFees,
  canReviewFees,
  reviewHistoryRefreshVersion,
  reviewTaskRefreshVersion,
  onOpenMarkPaid,
  onOpenStatusAction,
  onOpenReviewAction,
  onClose,
  onRetry,
}: {
  apiClient: ApiClient;
  authUser?: FeePermissionContext;
  detail: Loadable<FeeRecord>;
  demoUserId: string | null;
  feeRecordId: string | null;
  canManageFees: boolean;
  canReviewFees: boolean;
  reviewHistoryRefreshVersion: number;
  reviewTaskRefreshVersion: number;
  onOpenMarkPaid: (record: FeeRecord) => void;
  onOpenStatusAction: (kind: FeeStatusActionKind, record: FeeRecord) => void;
  onOpenReviewAction: (kind: FeeReviewActionKind, record: FeeRecord) => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  const state = getFeeDetailState(detail);
  const open = Boolean(feeRecordId);

  return (
    <Drawer
      className="fee-detail-drawer"
      title="费用详情"
      width={760}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <DataState
        loading={detail.loading}
        error={detail.error}
        empty={state.kind === "empty"}
        emptyText={state.emptyText}
        onRetry={onRetry}
      >
        {detail.data ? (
          <FeeDetailContent
            apiClient={apiClient}
            authUser={authUser}
            demoUserId={demoUserId}
            mode="management"
            record={detail.data}
            canManageFees={canManageFees}
            canReviewFees={canReviewFees}
            reviewHistoryRefreshVersion={reviewHistoryRefreshVersion}
            reviewTaskRefreshVersion={reviewTaskRefreshVersion}
            onOpenMarkPaid={onOpenMarkPaid}
            onOpenStatusAction={onOpenStatusAction}
            onOpenReviewAction={onOpenReviewAction}
          />
        ) : null}
      </DataState>
    </Drawer>
  );
}

export function ReadonlyFeeDetailDrawer({
  apiClient,
  demoUserId,
  feeRecordId,
  onClose,
  open,
}: {
  apiClient: ApiClient;
  demoUserId: string | null;
  feeRecordId: string;
  onClose: () => void;
  open: boolean;
}) {
  const [detail, setDetail] = useState<Loadable<FeeRecord>>(emptyLoadable);

  const loadDetail = useCallback(() => {
    if (!demoUserId || !feeRecordId.trim()) {
      setDetail(emptyLoadable);
      return;
    }

    setDetail({ loading: true, data: null, error: null });
    void loadFeeDetailForDemoUser(apiClient, demoUserId, feeRecordId)
      .then((data) => setDetail({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setDetail({
          loading: false,
          data: null,
          error: mapFeeDetailErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [apiClient, demoUserId, feeRecordId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadDetail();
  }, [loadDetail, open]);

  const state = getFeeDetailState(detail);

  return (
    <Drawer
      className="fee-detail-drawer"
      title="费用详情"
      width={760}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <DataState
        loading={detail.loading}
        error={detail.error}
        empty={state.kind === "empty"}
        emptyText={state.emptyText}
        onRetry={loadDetail}
      >
        {detail.data ? (
          <FeeDetailContent
            apiClient={apiClient}
            demoUserId={demoUserId}
            mode="search-readonly"
            record={detail.data}
          />
        ) : null}
      </DataState>
    </Drawer>
  );
}

function FeeDetailContent({
  apiClient,
  authUser,
  demoUserId,
  mode = "management",
  record,
  canManageFees = true,
  canReviewFees = false,
  reviewHistoryRefreshVersion = 0,
  reviewTaskRefreshVersion = 0,
  onOpenMarkPaid,
  onOpenStatusAction,
  onOpenReviewAction,
}: {
  apiClient: ApiClient;
  authUser?: FeePermissionContext;
  demoUserId: string | null;
  mode?: FeeDetailContentMode;
  record: FeeRecord;
  canManageFees?: boolean;
  canReviewFees?: boolean;
  reviewHistoryRefreshVersion?: number;
  reviewTaskRefreshVersion?: number;
  onOpenMarkPaid?: (record: FeeRecord) => void;
  onOpenStatusAction?: (kind: FeeStatusActionKind, record: FeeRecord) => void;
  onOpenReviewAction?: (kind: FeeReviewActionKind, record: FeeRecord) => void;
}) {
  const showMarkPaidAction = shouldShowFeeDetailMarkPaidAction(record, mode, canManageFees);
  const showStatusActions = shouldShowFeeDetailStatusActions(record, mode, canManageFees);

  return (
    <Space direction="vertical" size={16} className="full-width">
      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          {mode === "search-readonly" ? "费用详情" : "费用详情"}
        </Typography.Text>
        <Typography.Text type="secondary">
          {mode === "search-readonly"
            ? "本区域展示费用详情和可读附件信息；如需办理缴费或状态变更，请进入费用管理。"
            : "本区域展示费用基础信息、审核记录和凭证附件；可用操作会按当前账号权限展示。"}
        </Typography.Text>
      </div>
      <div className="business-note">
        <Typography.Text strong className="business-note-title">
          {feeVoucherAttachmentBoundary.title}
        </Typography.Text>
        <Typography.Text type="secondary">{feeVoucherAttachmentBoundary.description}</Typography.Text>
      </div>
      <Divider orientation="left">基础字段</Divider>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="费用 ID">{record.id}</Descriptions.Item>
        <Descriptions.Item label="成果 ID">{record.achievementId}</Descriptions.Item>
        <Descriptions.Item label="部门 ID">{record.departmentId}</Descriptions.Item>
        <Descriptions.Item label="费用类型">{getFeeTypeLabel(record.feeType)}</Descriptions.Item>
        <Descriptions.Item label="资金来源">{record.fundSource ?? "未返回"}</Descriptions.Item>
        <Descriptions.Item label="金额">{formatAmount(record.amount)}</Descriptions.Item>
        <Descriptions.Item label="截止日期">{formatDate(record.dueDate)}</Descriptions.Item>
        <Descriptions.Item label="缴费日期">{formatDate(record.paidDate)}</Descriptions.Item>
        <Descriptions.Item label="缴费状态">
          <Tag color={payStatusColors[record.payStatus] ?? "default"}>
            {getPayStatusLabel(record.payStatus)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="审核状态">
          <Tag color={reviewStatusColors[record.reviewStatus] ?? "default"}>
            {getFeeReviewStatusLabel(record.reviewStatus)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="审核人 ID">{record.reviewedById ?? "未审核"}</Descriptions.Item>
        <Descriptions.Item label="审核时间">{formatDateTime(record.reviewedAt)}</Descriptions.Item>
        <Descriptions.Item label="凭证编号">{record.voucherNo ?? "未登记"}</Descriptions.Item>
      </Descriptions>

      <FeeReviewHistorySection
        apiClient={apiClient}
        authUser={authUser}
        demoUserId={demoUserId}
        feeRecordId={record.id}
        mode={mode}
        refreshKey={buildFeeReviewHistoryRefreshKey(record, reviewHistoryRefreshVersion)}
      />

      <FeeReviewWorkflowTaskSection
        apiClient={apiClient}
        canReviewFees={canReviewFees}
        feeRecord={record}
        mode={mode}
        refreshVersion={reviewTaskRefreshVersion}
        onOpenReviewAction={onOpenReviewAction}
      />

      <FeeVoucherAttachmentSection
        apiClient={apiClient}
        authUser={authUser}
        demoUserId={demoUserId}
        feeRecordId={record.id}
        mode={mode}
      />

      {showMarkPaidAction ? (
        <Alert
          showIcon
          type="warning"
          message="可标记缴费"
          description="该费用当前处于待缴或逾期状态，可打开标记缴费表单。"
          action={
            <Button size="small" onClick={() => onOpenMarkPaid?.(record)}>
              标记缴费
            </Button>
          }
        />
      ) : mode === "search-readonly" ? (
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            费用信息
          </Typography.Text>
          <Typography.Text type="secondary">
            当前视图用于查看费用详情。
          </Typography.Text>
        </div>
      ) : (
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            当前状态无需缴费操作
          </Typography.Text>
          <Typography.Text type="secondary">
            已缴、已减免和已取消记录不显示标记缴费入口。
          </Typography.Text>
        </div>
      )}

      {showStatusActions ? (
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            状态调整
          </Typography.Text>
          <Typography.Text type="secondary">
            待缴或逾期费用可申请减免或取消，提交时需要填写原因。
          </Typography.Text>
          <Space>
            <Button size="small" onClick={() => onOpenStatusAction?.("waive", record)}>
              减免
            </Button>
            <Button size="small" danger onClick={() => onOpenStatusAction?.("cancel", record)}>
              取消
            </Button>
          </Space>
        </div>
      ) : null}

      <Divider orientation="left">审计字段</Divider>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="创建人 ID">{record.createdById ?? "未返回"}</Descriptions.Item>
        <Descriptions.Item label="更新人 ID">{record.updatedById ?? "未返回"}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDateTime(record.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{formatDateTime(record.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label="归档状态">
          {record.archivedAt ? `已归档：${formatDateTime(record.archivedAt)}` : "未归档"}
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );
}

function FeeReviewHistorySection({
  apiClient,
  authUser,
  demoUserId,
  feeRecordId,
  mode,
  refreshKey,
}: {
  apiClient: ApiClient;
  authUser?: FeePermissionContext;
  demoUserId: string | null;
  feeRecordId: string;
  mode: FeeDetailContentMode;
  refreshKey: string;
}) {
  const [history, setHistory] =
    useState<Loadable<FeeReviewHistoryEntry[]>>(emptyLoadable);
  const canLoadHistory =
    shouldLoadFeeReviewHistory(demoUserId, feeRecordId) &&
    canReadFeeReviewHistory(authUser, mode);

  const loadHistory = useCallback(async () => {
    if (!canLoadHistory) {
      setHistory(emptyLoadable);
      return;
    }

    setHistory({ loading: true, data: null, error: null });

    try {
      const data = await fetchFeeReviewHistory(apiClient, feeRecordId);
      setHistory({ loading: false, data, error: null });
    } catch (error) {
      setHistory({
        loading: false,
        data: null,
        error: mapFeeReviewHistoryErrorToDisplay(normalizeError(error)),
      });
    }
  }, [apiClient, canLoadHistory, feeRecordId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  if (!canLoadHistory) {
    return null;
  }

  const state = getFeeReviewHistoryState(history);
  const items = history.data ?? [];

  return (
    <>
      <Divider orientation="left">审核历史</Divider>
      <Space direction="vertical" size={12} className="full-width">
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            审核历史
          </Typography.Text>
          <Typography.Text type="secondary">展示审核动作、状态变化、原因、审核人和时间。</Typography.Text>
        </div>
        <DataState
          loading={history.loading}
          error={history.error}
          empty={state.kind === "empty"}
          emptyText={state.emptyText}
          onRetry={loadHistory}
        >
          <Table<FeeReviewHistoryEntry>
            className="fee-review-history-table"
            rowKey="id"
            columns={buildFeeReviewHistoryColumns()}
            dataSource={items}
            pagination={false}
            size="small"
            scroll={{ x: 760 }}
          />
        </DataState>
      </Space>
    </>
  );
}

function FeeReviewWorkflowTaskSection({
  apiClient,
  canReviewFees,
  feeRecord,
  mode,
  refreshVersion,
  onOpenReviewAction,
}: {
  apiClient: ApiClient;
  canReviewFees: boolean;
  feeRecord: FeeRecord;
  mode: FeeDetailContentMode;
  refreshVersion: number;
  onOpenReviewAction?: (kind: FeeReviewActionKind, record: FeeRecord) => void;
}) {
  const [tasks, setTasks] = useState<Loadable<WorkflowTask[]>>(emptyLoadable);
  const canLoadTasks = shouldLoadFeeReviewWorkflowTasks(
    feeRecord.id,
    mode,
    canReviewFees,
  );
  const refreshKey = buildFeeReviewWorkflowTaskRefreshKey(feeRecord, refreshVersion);

  const loadTasks = useCallback(async () => {
    if (!canLoadTasks) {
      setTasks(emptyLoadable);
      return;
    }

    setTasks({ loading: true, data: null, error: null });

    try {
      const data = await fetchFeeReviewWorkflowTasks(apiClient, feeRecord.id);
      setTasks({ loading: false, data, error: null });
    } catch (error) {
      setTasks({
        loading: false,
        data: null,
        error: mapFeeWorkflowTaskErrorToDisplay(normalizeError(error)),
      });
    }
  }, [apiClient, canLoadTasks, feeRecord.id]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks, refreshKey]);

  if (!canLoadTasks) {
    return null;
  }

  const items = tasks.data ?? [];
  const pendingTask = findPendingFeeReviewWorkflowTask(items, feeRecord.id);
  const showReviewActions = shouldShowFeeDetailReviewActions(
    feeRecord,
    mode,
    canReviewFees,
    pendingTask,
  );
  const empty = !tasks.loading && !tasks.error && items.length === 0;

  return (
    <>
      <Divider orientation="left">费用审核任务</Divider>
      <Space direction="vertical" size={12} className="full-width">
        <Alert
          showIcon
          type={showReviewActions ? "info" : "warning"}
          message={
            showReviewActions
              ? "当前用户可处理待审核费用任务"
              : "暂无可执行的费用审核任务"
          }
          description={
            showReviewActions
              ? "通过和驳回将同步完成对应审批任务。"
              : "只有当前用户拥有该费用记录的待处理费用审核任务时，才显示审核操作。"
          }
          action={
            showReviewActions ? (
              <Space>
                <Button size="small" onClick={() => onOpenReviewAction?.("approve", feeRecord)}>
                  通过费用审核
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => onOpenReviewAction?.("reject", feeRecord)}
                >
                  Reject fee review
                </Button>
              </Space>
            ) : undefined
          }
        />
        <DataState
          loading={tasks.loading}
          error={tasks.error}
          empty={empty}
          emptyText="当前账号没有待处理的费用审核任务"
          onRetry={loadTasks}
        >
          <div className="fee-review-workflow-task-list">
            {items.map((task) => (
              <FeeReviewWorkflowTaskCard key={task.id} task={task} />
            ))}
          </div>
        </DataState>
      </Space>
    </>
  );
}

function FeeReviewWorkflowTaskCard({ task }: { task: WorkflowTask }) {
  const instance = task.instance;

  return (
    <div className="attachment-metadata-card">
      <div className="attachment-metadata-main">
        <Space size={8} wrap>
          <Typography.Text strong>{getWorkflowStepLabel(task.stepCode)}</Typography.Text>
          <Tag color={getFeeWorkflowTaskStatusColor(task.status)}>
            {getWorkflowTaskStatusLabel(task.status)}
          </Tag>
          {instance ? <Tag>{getWorkflowInstanceStatusLabel(instance.status)}</Tag> : null}
        </Space>
        <Typography.Text type="secondary" className="attachment-metadata-id">
          任务标识：{task.id}
        </Typography.Text>
      </div>
      <div className="attachment-metadata-grid">
        <FeeVoucherMetadataLine label="流程步骤" value={getWorkflowStepLabel(task.stepCode)} />
        <FeeVoucherMetadataLine
          label="状态"
          value={getWorkflowTaskStatusLabel(task.status)}
        />
        <FeeVoucherMetadataLine
          label="处理人"
          value={formatReviewerDisplay(task.assigneeId)}
        />
        <FeeVoucherMetadataLine label="创建时间" value={formatDateTime(task.createdAt)} />
        <FeeVoucherMetadataLine label="更新时间" value={formatDateTime(task.updatedAt)} />
        <FeeVoucherMetadataLine label="完成时间" value={formatDateTime(task.completedAt)} />
        <FeeVoucherMetadataLine
          label="目标"
          value={instance ? getWorkflowTargetTypeLabel(instance.targetType) : "未返回"}
        />
        <FeeVoucherMetadataLine
          label="当前步骤"
          value={getWorkflowStepLabel(instance?.currentStep)}
        />
      </div>
    </div>
  );
}

function FeeVoucherAttachmentSection({
  apiClient,
  authUser,
  demoUserId,
  feeRecordId,
  mode,
}: {
  apiClient: ApiClient;
  authUser?: FeePermissionContext;
  demoUserId: string | null;
  feeRecordId: string;
  mode: FeeDetailContentMode;
}) {
  const [attachments, setAttachments] =
    useState<Loadable<AttachmentMetadata[]>>(emptyLoadable);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [secretLevel, setSecretLevel] = useState<SecretLevelCode | undefined>("INTERNAL");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<ApiError | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<ApiError | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [previewingAttachmentId, setPreviewingAttachmentId] = useState<string | null>(null);
  const [previewState, setPreviewState] =
    useState<AttachmentPreviewState>(emptyAttachmentPreviewState);
  const canLoadAttachments =
    shouldLoadFeeVoucherAttachments(demoUserId, feeRecordId) &&
    canReadFeeVoucherAttachments(authUser, mode);
  const canUpload = canLoadAttachments && canUploadFeeVoucherAttachments(authUser, mode);

  const loadAttachments = useCallback(async () => {
    if (!canLoadAttachments) {
      setAttachments(emptyLoadable);
      return;
    }

    setAttachments({ loading: true, data: null, error: null });

    try {
      const data = await fetchFeeVoucherAttachments(apiClient, feeRecordId);
      setAttachments({ loading: false, data, error: null });
    } catch (error) {
      setAttachments({
        loading: false,
        data: null,
        error: mapAttachmentMetadataErrorToDisplay(normalizeError(error)),
      });
    }
  }, [apiClient, canLoadAttachments, feeRecordId]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  useEffect(() => {
    setSelectedAttachmentId(null);
    setSelectedFile(null);
    setDisplayName("");
    setSecretLevel("INTERNAL");
    setUploadError(null);
    setUploadSuccess(null);
    setDownloadError(null);
    setPreviewingAttachmentId(null);
    setPreviewState((current) => {
      revokeAttachmentPreviewObjectUrl(current.previewUrl);
      return emptyAttachmentPreviewState();
    });
  }, [feeRecordId]);

  useEffect(
    () => () => {
      revokeAttachmentPreviewObjectUrl(previewState.previewUrl);
    },
    [previewState.previewUrl],
  );

  const items = attachments.data ?? [];

  const onUpload = async () => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedFile) {
      setUploadError({
        kind: "bad-request",
        message: "请选择要上传的费用凭证附件",
      });
      return;
    }

    const validation = validateAttachmentUploadFile(selectedFile);
    if (!validation.ok) {
      setUploadError({
        kind: "bad-request",
        message: validation.message,
      });
      return;
    }

    setUploading(true);

    try {
      const uploaded = await uploadFeeVoucherAttachment(apiClient, feeRecordId, {
        file: selectedFile,
        displayName,
        secretLevel,
      });
      setSelectedFile(null);
      setDisplayName("");
      setSecretLevel("INTERNAL");
      setUploadSuccess(`费用凭证附件 ${uploaded?.fileName || selectedFile.name} 上传成功`);
      await loadAttachments();
    } catch (error) {
      setUploadError(mapAttachmentUploadErrorToDisplay(normalizeError(error)));
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (attachment: AttachmentMetadata) => {
    setDownloadError(null);
    setDownloadingAttachmentId(attachment.id);

    try {
      const blob = await downloadFeeVoucherAttachment(apiClient, feeRecordId, attachment.id);
      if (blob) {
        saveAttachmentBlob(blob, getAttachmentDownloadFileName(attachment));
        void message.success("费用凭证附件下载已开始");
      }
    } catch (error) {
      setDownloadError(mapAttachmentDownloadErrorToDisplay(normalizeError(error)));
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const closePreview = () => {
    setPreviewState((current) => {
      revokeAttachmentPreviewObjectUrl(current.previewUrl);
      return emptyAttachmentPreviewState();
    });
  };

  const onPreview = async (attachment: AttachmentMetadata) => {
    const fileName = getAttachmentDownloadFileName(attachment);
    if (!isPreviewableAttachment(attachment.mimeType)) {
      setPreviewState((current) => {
        revokeAttachmentPreviewObjectUrl(current.previewUrl);
        return {
          attachmentId: attachment.id,
          error: mapAttachmentPreviewErrorToDisplay({
            kind: "bad-request",
            status: 415,
            message: "Unsupported fee voucher attachment preview media type.",
          }),
          fileName,
          loading: false,
          mimeType: attachment.mimeType ?? null,
          open: true,
          previewUrl: null,
        };
      });
      return;
    }

    setPreviewingAttachmentId(attachment.id);
    setPreviewState((current) => {
      revokeAttachmentPreviewObjectUrl(current.previewUrl);
      return {
        attachmentId: attachment.id,
        error: null,
        fileName,
        loading: true,
        mimeType: attachment.mimeType ?? null,
        open: true,
        previewUrl: null,
      };
    });

    try {
      const blob = await previewFeeVoucherAttachment(apiClient, feeRecordId, attachment.id);
      const previewUrl = blob ? createAttachmentPreviewObjectUrl(blob) : null;
      setPreviewState((current) => ({
        ...current,
        attachmentId: attachment.id,
        error: null,
        loading: false,
        mimeType: blob?.type || attachment.mimeType || null,
        previewUrl,
      }));
    } catch (error) {
      setPreviewState((current) => ({
        ...current,
        attachmentId: attachment.id,
        error: mapAttachmentPreviewErrorToDisplay(normalizeError(error)),
        loading: false,
        previewUrl: null,
      }));
    } finally {
      setPreviewingAttachmentId(null);
    }
  };

  return (
    <>
      <Divider orientation="left">费用凭证附件</Divider>
      <Space direction="vertical" size={12} className="full-width">
        {canUpload ? (
          <FeeVoucherAttachmentUploadPanel
            displayName={displayName}
            file={selectedFile}
            secretLevel={secretLevel}
            uploading={uploading}
            uploadError={uploadError}
            uploadSuccess={uploadSuccess}
            onDisplayNameChange={setDisplayName}
            onFileChange={setSelectedFile}
            onSecretLevelChange={setSecretLevel}
            onUpload={() => void onUpload()}
          />
        ) : (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              凭证附件
            </Typography.Text>
            <Typography.Text type="secondary">
              {mode === "search-readonly"
                ? "当前视图展示可查看的费用凭证附件信息。"
                : "当前账号暂不可维护该费用凭证附件。"}
            </Typography.Text>
          </div>
        )}
        {!canLoadAttachments ? (
          <Alert
            showIcon
            type="warning"
            message="等待可读上下文"
            description="未选择业务用户或当前账号缺少费用查看权限时，不读取费用凭证附件信息。"
          />
        ) : (
          <DataState
            loading={attachments.loading}
            error={attachments.error}
            empty={!attachments.loading && !attachments.error && items.length === 0}
            emptyText="暂无费用凭证附件"
            onRetry={() => void loadAttachments()}
          >
            <FeeVoucherAttachmentList
              attachments={items}
              downloadingAttachmentId={downloadingAttachmentId}
              previewingAttachmentId={previewingAttachmentId}
              selectedAttachmentId={selectedAttachmentId}
              onDownload={(attachment) => void onDownload(attachment)}
              onPreview={(attachment) => void onPreview(attachment)}
              onSelectAttachment={setSelectedAttachmentId}
            />
          </DataState>
        )}
        {downloadError ? (
          <Alert
            showIcon
            type="error"
            message={downloadError.message}
            description={downloadError.detail}
          />
        ) : null}
        {selectedAttachmentId ? (
          <FeeVoucherAttachmentDetailPanel
            apiClient={apiClient}
            attachmentId={selectedAttachmentId}
            demoUserId={demoUserId}
            feeRecordId={feeRecordId}
            onClose={() => setSelectedAttachmentId(null)}
          />
        ) : null}
      </Space>
      <AttachmentPreviewModal
        error={previewState.error}
        fallbackActionLabel="下载凭证附件"
        fallbackHint="如在线预览不可用，可尝试下载已授权凭证附件；仍无法访问时请联系管理员确认权限和格式支持。"
        fileName={previewState.fileName}
        loading={previewState.loading}
        mimeType={previewState.mimeType}
        open={previewState.open}
        previewUrl={previewState.previewUrl}
        onFallbackDownload={() => {
          const attachment = items.find((item) => item.id === previewState.attachmentId);
          if (attachment) {
            void onDownload(attachment);
          }
        }}
        onClose={closePreview}
      />
    </>
  );
}

function FeeVoucherAttachmentUploadPanel({
  displayName,
  file,
  onDisplayNameChange,
  onFileChange,
  onSecretLevelChange,
  onUpload,
  secretLevel,
  uploadError,
  uploading,
  uploadSuccess,
}: {
  displayName: string;
  file: File | null;
  onDisplayNameChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSecretLevelChange: (value: SecretLevelCode | undefined) => void;
  onUpload: () => void;
  secretLevel?: SecretLevelCode;
  uploadError: ApiError | null;
  uploading: boolean;
  uploadSuccess: string | null;
}) {
  const fileValidation = file ? validateAttachmentUploadFile(file) : null;

  return (
    <div className="attachment-upload-panel">
      <Space direction="vertical" size={10} className="full-width">
        <Space size={10} wrap className="attachment-upload-controls">
          <input
            key={file ? `${file.name}:${file.size}:${file.lastModified}` : "empty"}
            aria-label="选择费用凭证附件"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          <Input
            className="attachment-display-name-input"
            placeholder="显示文件名，可留空"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
          />
          <Select
            allowClear
            className="attachment-secret-select"
            placeholder="附件密级"
            value={secretLevel}
            options={[
              { label: "公开", value: "PUBLIC" },
              { label: "内部", value: "INTERNAL" },
              { label: "秘密", value: "SECRET" },
              { label: "机密", value: "CONFIDENTIAL" },
            ]}
            onChange={(value) => onSecretLevelChange(value)}
          />
          <Button
            type="primary"
            loading={uploading}
            disabled={!file || fileValidation?.ok === false}
            onClick={onUpload}
          >
            上传附件
          </Button>
        </Space>
        <Typography.Text type="secondary">
          支持 PDF、PNG、JPG、DOC、DOCX、XLS、XLSX；单个文件不超过 10 MB。上传前会先检查文件格式和大小。
        </Typography.Text>
        {file ? (
          <Typography.Text type={fileValidation?.ok ? "secondary" : "danger"}>
            已选择：{file.name}（{formatAttachmentSize(file.size)}）
            {fileValidation?.ok ? "" : `；${fileValidation?.message}`}
          </Typography.Text>
        ) : null}
        {uploadSuccess ? <Alert showIcon type="success" message={uploadSuccess} /> : null}
        {uploadError ? (
          <Alert
            showIcon
            type="error"
            message={uploadError.message}
            description={uploadError.detail}
          />
        ) : null}
      </Space>
    </div>
  );
}

function FeeVoucherAttachmentList({
  attachments,
  downloadingAttachmentId,
  onDownload,
  onPreview,
  onSelectAttachment,
  previewingAttachmentId,
  selectedAttachmentId,
}: {
  attachments: AttachmentMetadata[];
  downloadingAttachmentId: string | null;
  onDownload: (attachment: AttachmentMetadata) => void;
  onPreview: (attachment: AttachmentMetadata) => void;
  onSelectAttachment: (attachmentId: string) => void;
  previewingAttachmentId: string | null;
  selectedAttachmentId: string | null;
}) {
  return (
    <div className="attachment-metadata-list">
      {attachments.map((attachment) => {
        const model = buildAttachmentMetadataViewModel(attachment);

        return (
          <div className="attachment-metadata-card" key={attachment.id}>
            <div className="attachment-metadata-main">
              <Space size={8} wrap>
                <Typography.Text strong>{model.fileName}</Typography.Text>
                <Tag>版本 {model.version}</Tag>
                <Tag color={getFeeVoucherAttachmentStatusTagColor(attachment.status)}>
                  {model.statusLabel}
                </Tag>
                <Tag color={attachment.secretLevel === "PUBLIC" ? "default" : "orange"}>
                  {model.secretLevelLabel}
                </Tag>
              </Space>
              <Typography.Text type="secondary" className="attachment-metadata-id">
                附件 ID：{model.id}
              </Typography.Text>
              <Space size={8} wrap>
                <Button
                  size="small"
                  type={selectedAttachmentId === attachment.id ? "primary" : "default"}
                  onClick={() => onSelectAttachment(attachment.id)}
                >
                  查看详情摘要
                </Button>
                <Button
                  size="small"
                  loading={downloadingAttachmentId === attachment.id}
                  onClick={() => onDownload(attachment)}
                >
                  下载
                </Button>
                <Button
                  size="small"
                  loading={previewingAttachmentId === attachment.id}
                  onClick={() => onPreview(attachment)}
                >
                  {isPreviewableAttachment(attachment.mimeType) ? "预览" : "预览说明"}
                </Button>
              </Space>
            </div>
            <div className="attachment-metadata-grid">
              <FeeVoucherMetadataLine label="原始名" value={model.originalName} />
              <FeeVoucherMetadataLine label="类型" value={model.mimeType} />
              <FeeVoucherMetadataLine label="大小" value={model.sizeLabel} />
              <FeeVoucherMetadataLine label="上传者" value={model.uploaderId} />
              <FeeVoucherMetadataLine label="关联对象" value={model.relationId} />
              <FeeVoucherMetadataLine label="创建时间" value={model.createdAt} />
              <FeeVoucherMetadataLine label="更新时间" value={model.updatedAt} />
              <FeeVoucherMetadataLine label="归档时间" value={model.archivedAt} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeeVoucherAttachmentDetailPanel({
  apiClient,
  attachmentId,
  demoUserId,
  feeRecordId,
  onClose,
}: {
  apiClient: ApiClient;
  attachmentId: string;
  demoUserId: string | null;
  feeRecordId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] =
    useState<Loadable<AttachmentDetailMetadata>>(emptyLoadable);
  const canLoadDetail = shouldLoadFeeVoucherAttachmentDetail(
    demoUserId,
    feeRecordId,
    attachmentId,
  );

  const loadDetail = useCallback(async () => {
    if (!canLoadDetail) {
      setDetail(emptyLoadable);
      return;
    }

    setDetail({ loading: true, data: null, error: null });

    try {
      const data = await fetchFeeVoucherAttachmentDetail(
        apiClient,
        feeRecordId,
        attachmentId,
      );
      setDetail({ loading: false, data, error: null });
    } catch (error) {
      setDetail({
        loading: false,
        data: null,
        error: mapAttachmentMetadataErrorToDisplay(normalizeError(error)),
      });
    }
  }, [apiClient, attachmentId, canLoadDetail, feeRecordId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const model = detail.data ? buildAttachmentMetadataViewModel(detail.data) : null;

  return (
    <div className="attachment-detail-metadata-panel">
      <Space direction="vertical" size={12} className="full-width">
        <div className="attachment-detail-metadata-heading">
          <Space direction="vertical" size={2}>
            <Typography.Text strong>费用凭证附件详情摘要</Typography.Text>
            <Typography.Text type="secondary">
              附件基础信息
            </Typography.Text>
          </Space>
          <Button size="small" onClick={onClose}>
            关闭详情
          </Button>
        </div>
        {!canLoadDetail ? (
          <Alert
            showIcon
            type="warning"
            message="等待可读上下文"
            description="未选择业务用户或缺少附件 ID 时，不读取费用凭证附件详情。"
          />
        ) : (
          <DataState
            loading={detail.loading}
            error={detail.error}
            empty={!detail.loading && !detail.error && !detail.data}
            emptyText="暂无费用凭证附件详情"
            onRetry={() => void loadDetail()}
          >
            {model ? <FeeVoucherAttachmentDetailContent model={model} /> : null}
          </DataState>
        )}
      </Space>
    </div>
  );
}

function FeeVoucherAttachmentDetailContent({
  model,
}: {
  model: ReturnType<typeof buildAttachmentMetadataViewModel>;
}) {
  return (
    <div className="attachment-detail-metadata-grid">
      <FeeVoucherMetadataLine label="附件 ID" value={model.id} />
      <FeeVoucherMetadataLine label="文件名" value={model.fileName} />
      <FeeVoucherMetadataLine label="关联类型" value={model.relationType} />
      <FeeVoucherMetadataLine label="关联对象" value={model.relationId} />
      <FeeVoucherMetadataLine label="版本" value={`v${model.version}`} />
      <FeeVoucherMetadataLine label="上传者" value={model.uploaderId} />
      <FeeVoucherMetadataLine label="密级" value={model.secretLevelLabel} />
      <FeeVoucherMetadataLine label="状态" value={model.statusLabel} />
      <FeeVoucherMetadataLine label="创建时间" value={model.createdAt} />
      <FeeVoucherMetadataLine label="更新时间" value={model.updatedAt} />
      <FeeVoucherMetadataLine label="归档时间" value={model.archivedAt} />
    </div>
  );
}

function FeeVoucherMetadataLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="attachment-metadata-line">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text>{renderAttachmentMetadataValue(value)}</Typography.Text>
    </div>
  );
}

function CreateFeeDrawer({
  open,
  values,
  errors,
  status,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  values: CreateFeeFormValues;
  errors: CreateFeeFormErrors;
  status: MutationState;
  onChange: (patch: Partial<CreateFeeFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Drawer
      className="fee-form-drawer"
      title="新增费用"
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            费用信息
          </Typography.Text>
          <Typography.Text type="secondary">
            提交前请确认成果、费用类型、金额和截止日期等信息。
          </Typography.Text>
        </div>
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            {feeVoucherAttachmentBoundary.title}
          </Typography.Text>
          <Typography.Text type="secondary">{feeVoucherAttachmentBoundary.description}</Typography.Text>
        </div>
        <MutationStateAlert state={status} />
        <div className="fee-form-grid">
          <FormField label="成果 ID" error={errors.achievementId} required>
            <Input
              value={values.achievementId}
              placeholder="输入可管理成果的 UUID"
              onChange={(event) => onChange({ achievementId: event.target.value })}
            />
          </FormField>
          <FormField label="费用类型" error={errors.feeType} required>
            <Select
              allowClear
              className="full-width"
              placeholder="选择费用类型"
              options={feeTypeOptions}
              value={values.feeType}
              onChange={(value) => onChange({ feeType: value })}
            />
          </FormField>
          <FormField label="资金来源" error={errors.fundSource}>
            <Select
              allowClear
              className="full-width"
              placeholder="可选"
              options={fundSourceOptions}
              value={values.fundSource}
              onChange={(value) => onChange({ fundSource: value })}
            />
          </FormField>
          <FormField label="金额" error={errors.amount} required>
            <Input
              value={values.amount}
              placeholder="例如 1200.50"
              onChange={(event) => onChange({ amount: event.target.value })}
            />
          </FormField>
          <FormField label="截止日期" error={errors.dueDate} required>
            <Input
              type="date"
              value={values.dueDate}
              onChange={(event) => onChange({ dueDate: event.target.value })}
            />
          </FormField>
          <FormField label="凭证编号" error={errors.voucherNo}>
            <Input
              value={values.voucherNo}
              maxLength={120}
              placeholder="填写已取得的凭证编号"
              onChange={(event) => onChange({ voucherNo: event.target.value })}
            />
          </FormField>
        </div>
        <div className="fee-form-actions">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={status.loading} onClick={onSubmit}>
            提交新增费用
          </Button>
        </div>
      </Space>
    </Drawer>
  );
}

function MarkFeePaidDrawer({
  record,
  values,
  errors,
  status,
  canManageFees,
  onChange,
  onClose,
  onSubmit,
}: {
  record: FeeRecord | null;
  values: MarkFeePaidFormValues;
  errors: MarkFeePaidFormErrors;
  status: MutationState;
  canManageFees: boolean;
  onChange: (patch: Partial<MarkFeePaidFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Drawer
      className="fee-form-drawer"
      title="标记缴费"
      width={560}
      open={Boolean(record)}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            缴费信息
          </Typography.Text>
          <Typography.Text type="secondary">提交前请确认缴费日期、凭证和备注信息。</Typography.Text>
        </div>
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            {feeVoucherAttachmentBoundary.title}
          </Typography.Text>
          <Typography.Text type="secondary">{feeVoucherAttachmentBoundary.description}</Typography.Text>
        </div>
        {record ? (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              {canManageFees && canMarkFeePaid(record) ? "可标记缴费" : "暂不可标记缴费"}
            </Typography.Text>
            <Typography.Text type="secondary">
              当前缴费状态：{getPayStatusLabel(record.payStatus)}
            </Typography.Text>
          </div>
        ) : null}
        <MutationStateAlert state={status} />
        <div className="fee-form-grid fee-form-grid-single">
          <FormField label="缴费日期" error={errors.paidDate}>
            <Input
              type="date"
              value={values.paidDate}
              onChange={(event) => onChange({ paidDate: event.target.value })}
            />
          </FormField>
          <FormField label="凭证编号" error={errors.voucherNo}>
            <Input
              value={values.voucherNo}
              maxLength={120}
              placeholder="填写已取得的凭证编号"
              onChange={(event) => onChange({ voucherNo: event.target.value })}
            />
          </FormField>
        </div>
        <div className="fee-form-actions">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={status.loading}
            disabled={!record || !canManageFees || !canMarkFeePaid(record)}
            onClick={onSubmit}
          >
            确认标记缴费
          </Button>
        </div>
      </Space>
    </Drawer>
  );
}

function FeeStatusActionDrawer({
  action,
  values,
  errors,
  status,
  canManageFees,
  onChange,
  onClose,
  onSubmit,
}: {
  action: { kind: FeeStatusActionKind; record: FeeRecord } | null;
  values: FeeStatusActionFormValues;
  errors: FeeStatusActionFormErrors;
  status: MutationState;
  canManageFees: boolean;
  onChange: (patch: Partial<FeeStatusActionFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const record = action?.record ?? null;
  const title = action?.kind === "waive" ? "减免费用" : "取消费用";
  const submitLabel = action?.kind === "waive" ? "确认减免" : "确认取消";

  return (
    <Drawer
      className="fee-form-drawer"
      title={title}
      width={560}
      open={Boolean(action)}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {record ? (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              {canManageFees && canWaiveOrCancelFee(record)
                ? "可变更缴费状态"
                : "当前状态暂不支持调整"}
            </Typography.Text>
            <Typography.Text type="secondary">
              当前缴费状态：{getPayStatusLabel(record.payStatus)}
            </Typography.Text>
          </div>
        ) : null}
        <MutationStateAlert state={status} />
        <div className="fee-form-grid fee-form-grid-single">
          <FormField label="原因" error={errors.reason} required>
            <Input.TextArea
              value={values.reason}
              maxLength={500}
              rows={5}
              placeholder="请输入减免或取消原因，1-500 个字符"
              onChange={(event) => onChange({ reason: event.target.value })}
            />
          </FormField>
        </div>
        <div className="fee-form-actions">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            danger={action?.kind === "cancel"}
            loading={status.loading}
            disabled={!record || !canManageFees || !canWaiveOrCancelFee(record)}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      </Space>
    </Drawer>
  );
}

function FeeReviewActionDrawer({
  action,
  values,
  errors,
  status,
  canReviewFees,
  onChange,
  onClose,
  onSubmit,
}: {
  action: { kind: FeeReviewActionKind; record: FeeRecord } | null;
  values: FeeReviewActionFormValues;
  errors: FeeReviewActionFormErrors;
  status: MutationState;
  canReviewFees: boolean;
  onChange: (patch: Partial<FeeReviewActionFormValues>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const record = action?.record ?? null;
  const title = action?.kind === "approve" ? "费用审核通过" : "费用审核拒绝";
  const submitLabel = action?.kind === "approve" ? "确认通过" : "确认拒绝";
  const reasonRequired = action?.kind === "reject";

  return (
    <Drawer
      className="fee-form-drawer"
      title={title}
      width={560}
      open={Boolean(action)}
      onClose={onClose}
      destroyOnClose
      extra={
        <Button type="text" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {record ? (
          <div className="business-note">
            <Typography.Text strong className="business-note-title">
              {canReviewFees && canReviewFee(record) ? "可审核费用" : "暂不可重复审核"}
            </Typography.Text>
            <Typography.Text type="secondary">
              当前审核状态：{getFeeReviewStatusLabel(record.reviewStatus)}。
            </Typography.Text>
          </div>
        ) : null}
        <MutationStateAlert state={status} />
        <div className="fee-form-grid fee-form-grid-single">
          <FormField label="审核原因" error={errors.reason} required={reasonRequired}>
            <Input.TextArea
              value={values.reason}
              maxLength={500}
              rows={5}
              placeholder={
                action?.kind === "approve"
                  ? "可选，1-500 个字符；不填写则不提交 reason"
                  : "拒绝原因必填，1-500 个字符"
              }
              onChange={(event) => onChange({ reason: event.target.value })}
            />
          </FormField>
        </div>
        <div className="fee-form-actions">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            danger={action?.kind === "reject"}
            loading={status.loading}
            disabled={!record || !canReviewFees || !canReviewFee(record)}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      </Space>
    </Drawer>
  );
}

function MutationStateAlert({ state }: { state: MutationState }) {
  if (state.error) {
    return <Alert showIcon type="error" message={state.error.message} description={state.error.detail} />;
  }

  if (state.successMessage) {
    return <Alert showIcon type="success" message={state.successMessage} />;
  }

  return null;
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="fee-form-field">
      <span>
        {label}
        {required ? <Typography.Text type="danger"> *</Typography.Text> : null}
      </span>
      {children}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
    </label>
  );
}

export const buildFeeQuery = (filters: FeeFilters): FeeQuery => ({
  ...trimFeeFilters(filters),
  take: defaultTake,
});

export const exportFeeCsv = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: FeeFilters,
  fields: readonly FeeExportField[] = defaultFeeExportFields,
): Promise<void> =>
  exportFeeLedger(client, filters, "csv", fields);

export const exportFeeXlsx = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: FeeFilters,
  fields: readonly FeeExportField[] = defaultFeeExportFields,
): Promise<void> => exportFeeLedger(client, filters, "xlsx", fields);

export const exportFeeLedger = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: FeeFilters,
  format: FeeExportFormat,
  fields: readonly FeeExportField[] = defaultFeeExportFields,
): Promise<void> => {
  const path = `/fees/export.${format}`;
  const fileName = `fees.${format}`;
  const query = {
    ...trimFeeFilters(filters),
    fields: serializeExportFields(fields),
  } as ApiQuery;

  if (format === "xlsx") {
    await downloadXlsxExport(client, path, query, fileName);
    return;
  }

  await downloadCsvExport(client, path, query, fileName);
};

type FeeExportFormat = "csv" | "xlsx";

export const serializeFeeExportFields = (fields: readonly FeeExportField[]): string =>
  serializeExportFields(fields);

const serializeExportFields = (fields: readonly string[]): string =>
  [...new Set(fields)].join(",");

export const fetchFeeRecords = async (
  client: ApiClient,
  query: FeeQuery,
): Promise<FeeRecord[]> => {
  const result = await client.get<unknown>("/fees", query);

  return Array.isArray(result) ? (result as FeeRecord[]) : [];
};

export const fetchFeeDetail = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
): Promise<FeeRecord | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return null;
  }

  return client.get<FeeRecord>(`/fees/${trimmedId}`);
};

export const fetchFeeReviewHistory = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
): Promise<FeeReviewHistoryEntry[]> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return [];
  }

  return client.get<FeeReviewHistoryEntry[]>(`/fees/${trimmedId}/review-history`);
};

const feeReviewWorkflowTaskStatuses: WorkflowTaskStatusCode[] = [
  "PENDING",
  "CLAIMED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

export const fetchFeeReviewWorkflowTasks = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
): Promise<WorkflowTask[]> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return [];
  }

  const results = await Promise.all(
    feeReviewWorkflowTaskStatuses.map((status) =>
      fetchMyWorkflowTasks(client, {
        status,
        targetType: "FEE_RECORD",
        feeRecordId: trimmedId,
      }),
    ),
  );
  const unique = new Map<string, WorkflowTask>();

  results.forEach((result) => {
    result.items.forEach((task) => {
      unique.set(task.id, task);
    });
  });

  return Array.from(unique.values());
};

export const fetchFeeVoucherAttachments = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  query: AttachmentListQuery = { take: feeVoucherAttachmentDefaultTake },
): Promise<AttachmentMetadata[]> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return [];
  }

  return client.get<AttachmentMetadata[]>(
    `/fees/${trimmedId}/voucher-attachments`,
    query,
  );
};

export const fetchFeeVoucherAttachmentDetail = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  attachmentId: string | null | undefined,
): Promise<AttachmentDetailMetadata | null> => {
  const trimmedFeeId = feeRecordId?.trim();
  const trimmedAttachmentId = attachmentId?.trim();

  if (!trimmedFeeId || !trimmedAttachmentId) {
    return null;
  }

  return client.get<AttachmentDetailMetadata>(
    `/fees/${trimmedFeeId}/voucher-attachments/${trimmedAttachmentId}`,
  );
};

export const buildFeeVoucherAttachmentFormData = (
  input: UploadFeeVoucherAttachmentInput,
): FormData => buildAchievementAttachmentFormData(input);

export const uploadFeeVoucherAttachment = (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  input: UploadFeeVoucherAttachmentInput,
): Promise<AttachmentMetadata | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return Promise.resolve(null);
  }

  if (!client.postForm) {
    throw new Error("Fee voucher attachment upload requires multipart API client support.");
  }

  return client.postForm<AttachmentMetadata>(
    `/fees/${trimmedId}/voucher-attachments`,
    buildFeeVoucherAttachmentFormData(input),
  );
};

export const downloadFeeVoucherAttachment = (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  attachmentId: string | null | undefined,
): Promise<Blob | null> => {
  const trimmedFeeId = feeRecordId?.trim();
  const trimmedAttachmentId = attachmentId?.trim();

  if (!trimmedFeeId || !trimmedAttachmentId) {
    return Promise.resolve(null);
  }

  if (!client.downloadBlob) {
    throw new Error("Fee voucher attachment download requires blob API client support.");
  }

  return client.downloadBlob(
    `/fees/${trimmedFeeId}/voucher-attachments/${trimmedAttachmentId}/download`,
  );
};

export const previewFeeVoucherAttachment = (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  attachmentId: string | null | undefined,
): Promise<Blob | null> => {
  const trimmedFeeId = feeRecordId?.trim();
  const trimmedAttachmentId = attachmentId?.trim();

  if (!trimmedFeeId || !trimmedAttachmentId) {
    return Promise.resolve(null);
  }

  return downloadAttachmentPreviewBlob(
    client,
    `/fees/${trimmedFeeId}/voucher-attachments/${trimmedAttachmentId}/preview`,
  );
};

export const createFeeRecord = async (
  client: ApiClient,
  input: CreateFeeRecordInput,
): Promise<FeeRecord> => client.post<FeeRecord>("/fees", input);

export const createFeeRecordForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  input: CreateFeeRecordInput,
): Promise<FeeRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return createFeeRecord(client, input);
};

export const markFeePaid = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  input: MarkFeePaidInput,
): Promise<FeeStateRecord | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return null;
  }

  return client.post<FeeStateRecord>(`/fees/${trimmedId}/mark-paid`, input);
};

export const markFeePaidForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
  input: MarkFeePaidInput,
): Promise<FeeStateRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return markFeePaid(client, feeRecordId, input);
};

export const waiveFee = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  input: ChangeFeeStatusInput,
): Promise<FeeStateRecord | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return null;
  }

  return client.post<FeeStateRecord>(`/fees/${trimmedId}/waive`, input);
};

export const cancelFee = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  input: ChangeFeeStatusInput,
): Promise<FeeStateRecord | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return null;
  }

  return client.post<FeeStateRecord>(`/fees/${trimmedId}/cancel`, input);
};

export const waiveFeeForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
  input: ChangeFeeStatusInput,
): Promise<FeeStateRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return waiveFee(client, feeRecordId, input);
};

export const cancelFeeForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
  input: ChangeFeeStatusInput,
): Promise<FeeStateRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return cancelFee(client, feeRecordId, input);
};

export const approveFeeReview = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  input: ApproveFeeReviewInput = {},
): Promise<FeeStateRecord | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return null;
  }

  return client.post<FeeStateRecord>(`/fees/${trimmedId}/review/approve`, input);
};

export const rejectFeeReview = async (
  client: ApiClient,
  feeRecordId: string | null | undefined,
  input: RejectFeeReviewInput,
): Promise<FeeStateRecord | null> => {
  const trimmedId = feeRecordId?.trim();

  if (!trimmedId) {
    return null;
  }

  return client.post<FeeStateRecord>(`/fees/${trimmedId}/review/reject`, input);
};

export const approveFeeReviewForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
  input: ApproveFeeReviewInput = {},
): Promise<FeeStateRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return approveFeeReview(client, feeRecordId, input);
};

export const rejectFeeReviewForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
  input: RejectFeeReviewInput,
): Promise<FeeStateRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return rejectFeeReview(client, feeRecordId, input);
};

export const refreshFeesAfterMutation = async ({
  client,
  demoUserId,
  query,
  selectedFeeId,
  onFees,
  onDetail,
}: {
  client: ApiClient;
  demoUserId: string | null;
  query: FeeQuery;
  selectedFeeId?: string | null;
  onFees: (records: FeeRecord[]) => void;
  onDetail?: (record: FeeRecord | null) => void;
}): Promise<void> => {
  const records = await loadFeeRecordsForDemoUser(client, demoUserId, query);
  onFees(records);

  if (selectedFeeId?.trim() && onDetail) {
    onDetail(await loadFeeDetailForDemoUser(client, demoUserId, selectedFeeId));
  }
};

export const loadFeeRecordsForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  query: FeeQuery,
): Promise<FeeRecord[]> => {
  if (!demoUserId?.trim()) {
    return [];
  }

  return fetchFeeRecords(client, query);
};

export const loadFeeDetailForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
): Promise<FeeRecord | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return fetchFeeDetail(client, feeRecordId);
};

export const loadFeeReviewHistoryForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
): Promise<FeeReviewHistoryEntry[]> => {
  if (!demoUserId?.trim()) {
    return [];
  }

  return fetchFeeReviewHistory(client, feeRecordId);
};

export const getFeeListState = (
  state: Loadable<FeeRecord[]>,
  hasFilters: boolean,
): { kind: FeeListStateKind; emptyText?: string } => {
  if (state.loading) {
    return { kind: "loading" };
  }

  if (state.error) {
    return { kind: "error" };
  }

  if ((state.data ?? []).length === 0) {
    return {
      kind: "empty",
      emptyText: hasFilters ? "没有匹配的费用记录" : "暂无费用记录",
    };
  }

  return { kind: "ready" };
};

export const getFeeDetailState = (
  state: Loadable<FeeRecord>,
): { kind: FeeDetailStateKind; emptyText?: string } => {
  if (state.loading) {
    return { kind: "loading" };
  }

  if (state.error) {
    return { kind: "error" };
  }

  if (!state.data) {
    return { kind: "empty", emptyText: "请选择一条费用记录查看详情" };
  }

  return { kind: "ready" };
};

export const getFeeReviewHistoryState = (
  state: Loadable<FeeReviewHistoryEntry[]>,
): { kind: FeeReviewHistoryStateKind; emptyText?: string } => {
  if (state.loading) {
    return { kind: "loading" };
  }

  if (state.error) {
    return { kind: "error" };
  }

  if ((state.data ?? []).length === 0) {
    return { kind: "empty", emptyText: "暂无审核历史" };
  }

  return { kind: "ready" };
};

export const buildFeeReviewHistoryRefreshKey = (
  record: Pick<FeeRecord, "reviewStatus" | "reviewedAt">,
  version = 0,
): string => `${record.reviewStatus}:${record.reviewedAt ?? ""}:${version}`;

export const buildFeeReviewWorkflowTaskRefreshKey = (
  record: Pick<FeeRecord, "reviewStatus" | "reviewedAt">,
  version = 0,
): string => `${record.reviewStatus}:${record.reviewedAt ?? ""}:${version}`;

export const createDefaultFeeForm = (): CreateFeeFormValues => ({
  achievementId: "",
  feeType: undefined,
  fundSource: undefined,
  amount: "",
  dueDate: "",
  voucherNo: "",
});

export const createDefaultMarkPaidForm = (): MarkFeePaidFormValues => ({
  paidDate: "",
  voucherNo: "",
});

export const createDefaultFeeStatusActionForm = (): FeeStatusActionFormValues => ({
  reason: "",
});

export const createDefaultFeeReviewActionForm = (): FeeReviewActionFormValues => ({
  reason: "",
});

export const buildCreateFeeRecordPayload = (
  values: CreateFeeFormValues,
): { payload: CreateFeeRecordInput | null; errors: CreateFeeFormErrors } => {
  const errors = validateCreateFeeForm(values);

  if (Object.keys(errors).length > 0) {
    return { payload: null, errors };
  }

  const voucherNo = values.voucherNo.trim();

  return {
    errors,
    payload: {
      achievementId: values.achievementId.trim(),
      feeType: values.feeType as FeeTypeCode,
      fundSource: values.fundSource,
      amount: Number(values.amount),
      dueDate: values.dueDate.trim(),
      voucherNo: voucherNo || undefined,
    },
  };
};

export const buildMarkFeePaidPayload = (
  values: MarkFeePaidFormValues,
): { payload: MarkFeePaidInput | null; errors: MarkFeePaidFormErrors } => {
  const errors = validateMarkFeePaidForm(values);

  if (Object.keys(errors).length > 0) {
    return { payload: null, errors };
  }

  const paidDate = values.paidDate.trim();
  const voucherNo = values.voucherNo.trim();

  return {
    errors,
    payload: {
      paidDate: paidDate || undefined,
      voucherNo: voucherNo || undefined,
    },
  };
};

export const buildFeeStatusActionPayload = (
  values: FeeStatusActionFormValues,
): { payload: ChangeFeeStatusInput | null; errors: FeeStatusActionFormErrors } => {
  const errors = validateFeeStatusActionForm(values);

  if (Object.keys(errors).length > 0) {
    return { payload: null, errors };
  }

  return {
    errors,
    payload: {
      reason: values.reason.trim(),
    },
  };
};

export const buildFeeReviewActionPayload = (
  kind: FeeReviewActionKind,
  values: FeeReviewActionFormValues,
): {
  payload: ApproveFeeReviewInput | RejectFeeReviewInput | null;
  errors: FeeReviewActionFormErrors;
} => {
  const errors = validateFeeReviewActionForm(kind, values);

  if (Object.keys(errors).length > 0) {
    return { payload: null, errors };
  }

  const reason = values.reason.trim();

  if (kind === "approve") {
    return {
      errors,
      payload: reason ? { reason } : {},
    };
  }

  return {
    errors,
    payload: {
      reason,
    },
  };
};

export const validateCreateFeeForm = (values: CreateFeeFormValues): CreateFeeFormErrors => {
  const errors: CreateFeeFormErrors = {};
  const achievementId = values.achievementId.trim();
  const amount = values.amount.trim();
  const dueDate = values.dueDate.trim();
  const voucherNo = values.voucherNo.trim();

  if (!achievementId) {
    errors.achievementId = "请输入成果 ID。";
  } else if (!uuidPattern.test(achievementId)) {
    errors.achievementId = "成果 ID 必须是 UUID。";
  }

  if (!values.feeType) {
    errors.feeType = "请选择费用类型。";
  }

  if (!amount) {
    errors.amount = "请输入金额。";
  } else if (!amountPattern.test(amount) || Number(amount) < 0) {
    errors.amount = "金额必须为不小于 0 且最多 2 位小数的数字。";
  }

  if (!dueDate) {
    errors.dueDate = "请选择截止日期。";
  } else if (!isValidDateOnly(dueDate)) {
    errors.dueDate = "截止日期必须是有效日期。";
  }

  if (voucherNo.length > 120) {
    errors.voucherNo = "凭证编号不能超过 120 个字符。";
  }

  return errors;
};

export const validateMarkFeePaidForm = (
  values: MarkFeePaidFormValues,
): MarkFeePaidFormErrors => {
  const errors: MarkFeePaidFormErrors = {};
  const paidDate = values.paidDate.trim();
  const voucherNo = values.voucherNo.trim();

  if (paidDate && !isValidDateOnly(paidDate)) {
    errors.paidDate = "缴费日期必须是有效日期。";
  }

  if (voucherNo.length > 120) {
    errors.voucherNo = "凭证编号不能超过 120 个字符。";
  }

  return errors;
};

export const validateFeeStatusActionForm = (
  values: FeeStatusActionFormValues,
): FeeStatusActionFormErrors => {
  const errors: FeeStatusActionFormErrors = {};
  const reason = values.reason.trim();

  if (!reason) {
    errors.reason = "请输入原因。";
  } else if (reason.length > 500) {
    errors.reason = "原因不能超过 500 个字符。";
  }

  return errors;
};

export const validateFeeReviewActionForm = (
  kind: FeeReviewActionKind,
  values: FeeReviewActionFormValues,
): FeeReviewActionFormErrors => {
  const errors: FeeReviewActionFormErrors = {};
  const reason = values.reason.trim();

  if (kind === "reject" && !reason) {
    errors.reason = "请输入审核拒绝原因。";
  } else if (reason.length > 500) {
    errors.reason = "审核原因不能超过 500 个字符。";
  }

  return errors;
};

export const deriveFeeWarningSummary = (
  records: FeeRecord[],
  todayInput: Date = new Date(),
): FeeWarningSummary => {
  const classifications = classifyFeeWarningRecords(records, todayInput);

  return classifications.reduce<FeeWarningSummary>(
    (summary, classification) => {
      summary.total += 1;

      if (classification.record.payStatus === "PAID") {
        summary.paid += 1;
      }

      if (classification.record.payStatus === "PENDING") {
        summary.pending += 1;
      }

      if (classification.key === "overdue") {
        summary.overdue += 1;
      } else if (classification.key === "dueSoon") {
        summary.dueSoon += 1;
      }

      return summary;
    },
    {
      total: 0,
      overdue: 0,
      dueSoon: 0,
      paid: 0,
      pending: 0,
    },
  );
};

export const groupFeeWarnings = (
  records: FeeRecord[],
  todayInput: Date = new Date(),
): FeeWarningGroup[] => {
  const grouped: Record<FeeWarningGroupKey, FeeRecord[]> = {
    overdue: [],
    dueSoon: [],
    pendingLater: [],
    terminal: [],
  };

  classifyFeeWarningRecords(records, todayInput).forEach(({ key, record }) => {
    grouped[key].push(record);
  });

  return [
    {
      key: "overdue",
      title: "逾期",
      description: "费用已逾期，或处于待缴且截止日期早于今天。",
      records: grouped.overdue,
      color: "error",
    },
    {
      key: "dueSoon",
      title: "30 天内到期",
      description: "待缴且截止日期在未来 30 天内。",
      records: grouped.dueSoon,
      color: "warning",
    },
    {
      key: "pendingLater",
      title: "待缴未到期",
      description: "待缴但暂未进入 30 天到期窗口。",
      records: grouped.pendingLater,
      color: "processing",
    },
    {
      key: "terminal",
      title: "已完成 / 终态",
      description: "已缴、已减免或已取消记录。",
      records: grouped.terminal,
      color: "success",
    },
  ];
};

export const classifyFeeWarningRecords = (
  records: FeeRecord[],
  todayInput: Date = new Date(),
): FeeWarningClassification[] => {
  const today = toDateOnlyMs(todayInput);
  const dueSoonLimit = today + dueSoonDays * 24 * 60 * 60 * 1000;

  return records.map((record) => ({
    key: classifyFeeWarningRecord(record, today, dueSoonLimit),
    record,
  }));
};

const classifyFeeWarningRecord = (
  record: FeeRecord,
  today: number,
  dueSoonLimit: number,
): FeeWarningGroupKey => {
  const dueDate = parseDateOnlyMs(record.dueDate);
  const activePending = record.payStatus === "PENDING";

  if (record.payStatus === "PAID" || record.payStatus === "WAIVED" || record.payStatus === "CANCELLED") {
    return "terminal";
  }

  if (record.payStatus === "OVERDUE" || (activePending && dueDate !== null && dueDate < today)) {
    return "overdue";
  }

  if (activePending && dueDate !== null && dueDate <= dueSoonLimit) {
    return "dueSoon";
  }

  return "pendingLater";
};

export const buildFeeDetailOpenRequest = (record: FeeRecord): string => record.id;

export const canMarkFeePaid = (record: Pick<FeeRecord, "payStatus">): boolean =>
  record.payStatus === "PENDING" || record.payStatus === "OVERDUE";

export const canWaiveOrCancelFee = (record: Pick<FeeRecord, "payStatus">): boolean =>
  record.payStatus === "PENDING" || record.payStatus === "OVERDUE";

export const canReviewFee = (record: Pick<FeeRecord, "reviewStatus">): boolean =>
  record.reviewStatus === "PENDING";

export const canManageDepartmentFees = (
  authUser: FeePermissionContext,
): boolean => Boolean(authUser?.permissionCodes.includes("fee:manage_department"));

export const canReviewDepartmentFees = (
  authUser: FeePermissionContext,
): boolean => Boolean(authUser?.permissionCodes.includes("fee:review_department"));

export const canReadFeeReviewHistory = (
  authUser: FeePermissionContext,
  mode: FeeDetailContentMode = "management",
): boolean =>
  mode === "search-readonly" ||
  Boolean(
    authUser?.permissionCodes.some((permission) =>
      ["fee:read_department", "fee:manage_department", "fee:review_department"].includes(
        permission,
      ),
    ),
  );

export const canReadFeeVoucherAttachments = (
  authUser: FeePermissionContext,
  mode: FeeDetailContentMode = "management",
): boolean =>
  mode === "search-readonly" ||
  Boolean(
    authUser?.permissionCodes.some((permission) =>
      ["fee:read_department", "fee:manage_department", "fee:review_department"].includes(
        permission,
      ),
    ),
  );

export const canUploadFeeVoucherAttachments = (
  authUser: FeePermissionContext,
  mode: FeeDetailContentMode = "management",
): boolean => mode === "management" && canManageDepartmentFees(authUser);

export const shouldLoadFeeVoucherAttachments = (
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
): boolean => Boolean(demoUserId?.trim() && feeRecordId?.trim());

export const shouldLoadFeeReviewHistory = (
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
): boolean => Boolean(demoUserId?.trim() && feeRecordId?.trim());

export const shouldLoadFeeReviewWorkflowTasks = (
  feeRecordId: string | null | undefined,
  mode: FeeDetailContentMode = "management",
  canReviewFees = false,
): boolean =>
  mode === "management" &&
  canReviewFees &&
  Boolean(feeRecordId?.trim());

export const shouldLoadFeeVoucherAttachmentDetail = (
  demoUserId: string | null,
  feeRecordId: string | null | undefined,
  attachmentId: string | null | undefined,
): boolean =>
  Boolean(demoUserId?.trim() && feeRecordId?.trim() && attachmentId?.trim());

export const shouldShowFeeDetailMarkPaidAction = (
  record: Pick<FeeRecord, "payStatus">,
  mode: FeeDetailContentMode = "management",
  canManageFees = true,
): boolean => mode === "management" && canManageFees && canMarkFeePaid(record);

export const shouldShowFeeDetailStatusActions = (
  record: Pick<FeeRecord, "payStatus">,
  mode: FeeDetailContentMode = "management",
  canManageFees = true,
): boolean => mode === "management" && canManageFees && canWaiveOrCancelFee(record);

export const shouldShowFeeDetailReviewActions = (
  record: Pick<FeeRecord, "reviewStatus">,
  mode: FeeDetailContentMode = "management",
  canReviewFees = true,
  pendingTask: WorkflowTask | null = null,
): boolean =>
  mode === "management" &&
  canReviewFees &&
  canReviewFee(record) &&
  isPendingFeeReviewWorkflowTask(pendingTask);

export const findPendingFeeReviewWorkflowTask = (
  tasks: readonly WorkflowTask[],
  feeRecordId: string,
): WorkflowTask | null =>
  tasks.find(
    (task) =>
      isPendingFeeReviewWorkflowTask(task) &&
      task.instance?.targetId === feeRecordId,
  ) ?? null;

export const isPendingFeeReviewWorkflowTask = (
  task: WorkflowTask | null | undefined,
): task is WorkflowTask =>
  task?.status === "PENDING" &&
  task.stepCode === "FEE_REVIEW" &&
  task.instance?.targetType === "FEE_RECORD" &&
  task.instance.status === "ACTIVE" &&
  task.instance.currentStep === "FEE_REVIEW";

export const mapFeeDetailErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "forbidden" || error.kind === "unauthorized") {
    return {
      ...error,
      message: "当前用户无权查看该费用详情",
      detail: error.detail ?? "请切换具备费用读取权限的业务用户后重试。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "费用记录不存在或不可见",
      detail: error.detail ?? "该费用可能已被移除、归档，或不在当前用户可见范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "服务暂不可用，可重试",
      detail: error.detail ?? "费用详情接口暂时无法访问，请稍后重试。",
    };
  }

  return {
    ...error,
    message: error.message || "费用详情读取失败",
  };
};

export const mapFeeReviewHistoryErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "forbidden" || error.kind === "unauthorized") {
    return {
      ...error,
      message: "当前用户无权查看审核历史",
      detail: error.detail ?? "请切换到具备费用读取、管理或审核权限的业务用户后重试。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "审核历史不可见",
      detail: error.detail ?? "该费用可能不存在、已归档，或不在当前用户可见范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "审核历史暂时不可用，可重试",
      detail: error.detail ?? "审核历史接口暂时无法访问，请稍后重试。",
    };
  }

  return {
    ...error,
    message: error.message || "审核历史读取失败",
  };
};

export const mapFeeWorkflowTaskErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "forbidden" || error.kind === "unauthorized") {
    return {
      ...error,
      message: "当前账号无法读取费用审核任务。",
      detail: error.detail ?? "Switch to a scoped fee reviewer context and retry.",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "未找到费用审批任务",
      detail: error.detail ?? "该任务可能已完成、已取消，或不在当前账号可处理范围内。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "费用审批任务服务暂不可用",
      detail: error.detail ?? "请稍后在任务服务恢复后重试。",
    };
  }

  return {
    ...error,
    message: error.message || "费用审批任务请求失败",
  };
};

export const mapFeeMutationErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "bad-request" || error.status === 400) {
    return {
      ...error,
      message: "费用表单内容不符合要求",
      detail: error.detail ?? "请检查必填项、日期、金额、UUID 和凭证编号长度。",
    };
  }

  if (error.kind === "forbidden" || error.kind === "unauthorized") {
    return {
      ...error,
      message: "当前用户无权执行费用写操作",
      detail: error.detail ?? "请切换具备费用管理权限的业务用户后重试。",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "相关成果或费用记录不存在或不可见",
      detail: error.detail ?? "请确认成果 ID 或费用记录仍在当前用户可管理范围内。",
    };
  }

  if (error.status === 409) {
    return {
      ...error,
      message: "费用记录状态冲突，请刷新后重试",
      detail: error.detail ?? "该费用可能已被其他操作更新，或当前状态不允许标记缴费。",
    };
  }

  if (error.kind === "network" || error.kind === "server" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "服务暂不可用，可重试",
      detail: error.detail ?? "费用写操作接口暂时无法访问，请稍后重试。",
    };
  }

  return {
    ...error,
    message: error.message || "费用写操作失败",
  };
};

export const getFeeTypeLabel = (value: FeeTypeCode | string): string =>
  feeTypeLabels[value as FeeTypeCode] ?? value;

export const getPayStatusLabel = (value: PayStatusCode | string): string =>
  payStatusLabels[value as PayStatusCode] ?? value;

export const getFeeReviewStatusLabel = (value: FeeReviewStatusCode | string): string =>
  reviewStatusLabels[value as FeeReviewStatusCode] ?? value;

export const getFeeReviewHistoryActionLabel = (
  value: FeeReviewHistoryActionCode | string,
): string => reviewHistoryActionLabels[value as FeeReviewHistoryActionCode] ?? value;

export const formatReviewerDisplay = (reviewerId: string | null | undefined): string => {
  const trimmed = reviewerId?.trim();

  if (!trimmed) {
    return "未返回";
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
};

export const buildFeeReviewHistoryColumns = (): TableProps<FeeReviewHistoryEntry>["columns"] => [
  {
    title: "动作",
    dataIndex: "action",
    key: "action",
    width: 112,
    render: (value: FeeReviewHistoryActionCode) => (
      <Tag color={reviewHistoryActionColors[value] ?? "default"}>
        {getFeeReviewHistoryActionLabel(value)}
      </Tag>
    ),
  },
  {
    title: "状态变化",
    key: "status",
    width: 180,
    render: (_, item) => (
      <Space size={6} wrap>
        <Tag color={reviewStatusColors[item.fromStatus] ?? "default"}>
          {getFeeReviewStatusLabel(item.fromStatus)}
        </Tag>
        <Typography.Text type="secondary">→</Typography.Text>
        <Tag color={reviewStatusColors[item.toStatus] ?? "default"}>
          {getFeeReviewStatusLabel(item.toStatus)}
        </Tag>
      </Space>
    ),
  },
  {
    title: "审核原因",
    dataIndex: "reason",
    key: "reason",
    width: 260,
    render: (value: string | null) => (
      <Typography.Paragraph className="table-note" ellipsis={{ rows: 2 }} title={value ?? ""}>
        {value?.trim() || "未填写"}
      </Typography.Paragraph>
    ),
  },
  {
    title: "审核人",
    dataIndex: "reviewerId",
    key: "reviewerId",
    width: 148,
    render: (value: string) => formatReviewerDisplay(value),
  },
  {
    title: "时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 168,
    render: (value: string) => formatDateTime(value),
  },
];

const buildFeeColumns = (
  onOpenDetail: (record: FeeRecord) => void,
  onOpenMarkPaid: (record: FeeRecord) => void,
  onOpenStatusAction: (kind: FeeStatusActionKind, record: FeeRecord) => void,
  onOpenReviewAction: (kind: FeeReviewActionKind, record: FeeRecord) => void,
  canManageFees = true,
  canReviewFees = false,
): TableProps<FeeRecord>["columns"] => [
  {
    title: "费用记录",
    key: "record",
    width: 260,
    render: (_, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{getFeeTypeLabel(item.feeType)}</Typography.Text>
        <Typography.Text type="secondary" ellipsis>
          {item.id}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: "状态",
    dataIndex: "payStatus",
    key: "payStatus",
    width: 128,
    render: (value: PayStatusCode) => (
      <Tag color={payStatusColors[value] ?? "default"}>{getPayStatusLabel(value)}</Tag>
    ),
  },
  {
    title: "审核状态",
    dataIndex: "reviewStatus",
    key: "reviewStatus",
    width: 128,
    render: (value: FeeReviewStatusCode) => (
      <Tag color={reviewStatusColors[value] ?? "default"}>
        {getFeeReviewStatusLabel(value)}
      </Tag>
    ),
  },
  {
    title: "金额",
    dataIndex: "amount",
    key: "amount",
    width: 128,
    render: (value: FeeRecord["amount"]) => formatAmount(value),
  },
  {
    title: "截止日期",
    dataIndex: "dueDate",
    key: "dueDate",
    width: 144,
    render: (value: string) => formatDate(value),
  },
  {
    title: "缴费日期",
    dataIndex: "paidDate",
    key: "paidDate",
    width: 144,
    render: (value: string | null) => formatDate(value),
  },
  {
    title: "凭证编号",
    dataIndex: "voucherNo",
    key: "voucherNo",
    width: 160,
    render: (value: string | null) => value || "未登记",
  },
  {
    title: "成果 ID",
    dataIndex: "achievementId",
    key: "achievementId",
    width: 240,
    render: (value: string) => <Typography.Text ellipsis>{value}</Typography.Text>,
  },
  {
    title: "部门 ID",
    dataIndex: "departmentId",
    key: "departmentId",
    width: 220,
    render: (value: string) => <Typography.Text ellipsis>{value}</Typography.Text>,
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: "操作",
    key: "actions",
    width: 184,
    render: (_, item) => (
      <Space size={8} wrap>
        <Button size="small" onClick={() => onOpenDetail(item)}>
          查看详情
        </Button>
        {canManageFees && canMarkFeePaid(item) ? (
          <Button size="small" onClick={() => onOpenMarkPaid(item)}>
            标记缴费
          </Button>
        ) : null}
        {canManageFees && canWaiveOrCancelFee(item) ? (
          <>
            <Button size="small" onClick={() => onOpenStatusAction("waive", item)}>
              减免
            </Button>
            <Button size="small" danger onClick={() => onOpenStatusAction("cancel", item)}>
              取消
            </Button>
          </>
        ) : null}
        {canReviewFees && canReviewFee(item) ? (
          <>
            <Button size="small" onClick={() => onOpenReviewAction("approve", item)}>
              审核通过
            </Button>
            <Button size="small" danger onClick={() => onOpenReviewAction("reject", item)}>
              审核拒绝
            </Button>
          </>
        ) : null}
      </Space>
    ),
  },
];

const trimFeeFilters = (filters: FeeFilters): FeeFilters => ({
  achievementId: filters.achievementId?.trim() || undefined,
  feeType: filters.feeType,
  payStatus: filters.payStatus,
});

const hasActiveFilters = (filters: FeeFilters): boolean =>
  Boolean(filters.achievementId?.trim() || filters.feeType || filters.payStatus);

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

const formatAmount = (value: FeeRecord["amount"]): string => {
  const numeric = typeof value === "number" ? value : Number(value);

  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 2,
    }).format(numeric);
  }

  return String(value);
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "未返回";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(date);
};

const formatDateTime = (value: string | null | undefined): string => {
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

const renderAttachmentMetadataValue = (value: React.ReactNode): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return "未返回";
  }

  return value;
};

const getFeeVoucherAttachmentStatusTagColor = (value: string): string => {
  if (value === "ACTIVE") {
    return "green";
  }

  if (value === "BLOCKED") {
    return "red";
  }

  if (value === "ARCHIVED") {
    return "default";
  }

  return "blue";
};

const getFeeWorkflowTaskStatusColor = (value: string): string => {
  if (value === "PENDING" || value === "CLAIMED") {
    return "processing";
  }

  if (value === "APPROVED") {
    return "success";
  }

  if (value === "REJECTED") {
    return "error";
  }

  if (value === "CANCELLED") {
    return "default";
  }

  return "blue";
};

const parseDateOnlyMs = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateOnlyMs(parsed);
};

const isValidDateOnly = (value: string): boolean => {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
};

const toDateOnlyMs = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
