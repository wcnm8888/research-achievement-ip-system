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
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createApiClient,
  isApiError,
  type ApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type {
  CreateFeeRecordInput,
  FeeQuery,
  FeeRecord,
  FeeStateRecord,
  FeeTypeCode,
  FundSourceCode,
  MarkFeePaidInput,
  PayStatusCode,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
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

export type CreateFeeFormErrors = Partial<Record<keyof CreateFeeFormValues, string>>;

export type MarkFeePaidFormErrors = Partial<Record<keyof MarkFeePaidFormValues, string>>;

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
const dueSoonDays = 30;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const feeVoucherAttachmentBoundary = {
  title: "凭证附件能力边界",
  description:
    "voucherNo 仅表示凭证编号，不等于凭证附件文件。Step 15 不提供费用凭证附件上传/下载，不生成下载入口；真实附件能力需要后续单独确认费用凭证附件接口与数据路线。",
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
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
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const query = useMemo(() => buildFeeQuery(appliedFilters), [appliedFilters]);
  const canManageFees = canManageDepartmentFees(authUser);

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
              message: "请选择演示用户后再创建费用",
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
              message: "请选择演示用户后再标记缴费",
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

  const columns = useMemo(
    () => buildFeeColumns(openFeeDetail, openMarkPaidDrawer, canManageFees),
    [canManageFees, openFeeDetail, openMarkPaidDrawer],
  );

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="费用管理"
          description="选择本地演示用户后，前端才会请求后端费用台账。"
        />
        <PermissionHint description="当前没有 X-Demo-User-Id，费用管理不会发起业务请求。选择科研秘书或具备费用读取权限的演示上下文后，列表会统一由后端权限策略裁剪。" />
        <BoundaryNotice
          title="等待演示上下文"
          description="Step 15 已收口费用台账、详情、前端派生预警和写入口前端准备；当前无用户时不发业务请求，也不触发真实写入或凭证附件上传/下载。"
          step="Step 15D"
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
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="费用管理"
        description="读取后端 GET /fees 的真实费用台账；权限、范围和字段以后端返回为准。"
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
      <PermissionHint description="Step 15D 收口费用凭证附件边界：voucherNo 仅是凭证编号；费用凭证附件上传/下载、真实写入验收、独立 warnings API 和 Step 14 DataGap 均需后续单独确认。" />

      <Card className="shell-card" title="基础预警摘要" extra={<Tag>前端派生</Tag>}>
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
          摘要仅基于当前 GET /fees 列表结果计算：待缴或逾期状态会参与风险判断，已缴、已减免、已取消不作为到期风险。
        </Typography.Paragraph>
      </Card>

      <Card className="shell-card" title="预警列表 / 分组" extra={<Tag>前端派生</Tag>}>
        <Typography.Paragraph type="secondary" className="card-note">
          分组仅基于当前 GET /fees 列表的 dueDate / payStatus 计算，不代表独立 warnings API；列表之外的数据仍以后端实际返回为准。
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

      <Card className="shell-card">
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
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadFees}>刷新</Button>
        </Space>
      </Card>

      <Card className="shell-card" title="费用台账" extra={<Tag>GET /fees</Tag>}>
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
            scroll={{ x: 1120 }}
          />
        </DataState>
      </Card>

      <BoundaryNotice
        title={feeVoucherAttachmentBoundary.title}
        description={feeVoucherAttachmentBoundary.description}
        step="Step 15 overall: DONE_WITHOUT_REAL_WRITE_RISK"
      />
      <FeeDetailDrawer
        detail={feeDetail}
        feeRecordId={selectedFeeId}
        canManageFees={canManageFees}
        onOpenMarkPaid={openMarkPaidDrawer}
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
    </Space>
  );
}

function FeeDetailDrawer({
  detail,
  feeRecordId,
  canManageFees,
  onOpenMarkPaid,
  onClose,
  onRetry,
}: {
  detail: Loadable<FeeRecord>;
  feeRecordId: string | null;
  canManageFees: boolean;
  onOpenMarkPaid: (record: FeeRecord) => void;
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
            mode="management"
            record={detail.data}
            canManageFees={canManageFees}
            onOpenMarkPaid={onOpenMarkPaid}
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
        {detail.data ? <FeeDetailContent mode="search-readonly" record={detail.data} /> : null}
      </DataState>
    </Drawer>
  );
}

function FeeDetailContent({
  mode = "management",
  record,
  canManageFees = true,
  onOpenMarkPaid,
}: {
  mode?: FeeDetailContentMode;
  record: FeeRecord;
  canManageFees?: boolean;
  onOpenMarkPaid?: (record: FeeRecord) => void;
}) {
  const showMarkPaidAction = shouldShowFeeDetailMarkPaidAction(record, mode, canManageFees);

  return (
    <Space direction="vertical" size={16} className="full-width">
      <Alert
        showIcon
        type="info"
        message={mode === "search-readonly" ? "检索中心只读费用详情" : "只读费用详情"}
        description={
          mode === "search-readonly"
            ? "本区域只展示 GET /fees/:id 已返回字段；不会提供标记缴费、新增费用、附件上传下载、warnings API 或任何写入口。"
            : "本区域只展示 GET /fees/:id 已返回字段；voucherNo 仅为凭证编号，不补造成果标题、附件、审批、审计或凭证文件能力。"
        }
      />
      <Alert
        showIcon
        type="info"
        message={feeVoucherAttachmentBoundary.title}
        description={feeVoucherAttachmentBoundary.description}
      />
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
        <Descriptions.Item label="凭证编号">{record.voucherNo ?? "未登记"}</Descriptions.Item>
      </Descriptions>

      {showMarkPaidAction ? (
        <Alert
          showIcon
          type="warning"
          message="可标记缴费"
          description="该费用当前处于待缴或逾期状态，可登记 paidDate / voucherNo 凭证编号后调用现有 POST /fees/:id/mark-paid。本轮浏览器验收不执行真实提交，也不上传或下载凭证附件。"
          action={
            <Button size="small" onClick={() => onOpenMarkPaid?.(record)}>
              标记缴费
            </Button>
          }
        />
      ) : mode === "search-readonly" ? (
        <Alert
          showIcon
          type="info"
          message="检索中心只读边界"
          description="本视图只补齐费用检索结果的只读详情联动；标记缴费、创建费用、真实凭证附件、warnings API、审计日志和系统配置均不在 Step 16D 范围内。"
        />
      ) : (
        <Alert
          showIcon
          type="info"
          message="终态只读"
          description="已缴、已减免和已取消记录不展示标记缴费入口。"
        />
      )}

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
        <Alert
          showIcon
          type="warning"
          message="本轮不做真实写入验收"
          description="此表单按现有 POST /fees 契约塑造 payload；浏览器验收只打开、校验和关闭，不点击最终提交。"
        />
        <Alert
          showIcon
          type="info"
          message={feeVoucherAttachmentBoundary.title}
          description={feeVoucherAttachmentBoundary.description}
        />
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
              placeholder="仅登记 voucherNo 凭证编号，不上传或下载附件"
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
        <Alert
          showIcon
          type="warning"
          message="本轮不做真实写入验收"
          description="此表单按现有 POST /fees/:id/mark-paid 契约塑造 payload；浏览器验收只打开、校验和关闭，不点击最终标记缴费。"
        />
        <Alert
          showIcon
          type="info"
          message={feeVoucherAttachmentBoundary.title}
          description={feeVoucherAttachmentBoundary.description}
        />
        {record ? (
          <Alert
            showIcon
            type={canManageFees && canMarkFeePaid(record) ? "info" : "warning"}
            message={
              canManageFees && canMarkFeePaid(record)
                ? "当前费用可标记缴费"
                : "当前费用不可标记缴费"
            }
            description={`费用 ${record.id} 当前状态：${getPayStatusLabel(record.payStatus)}`}
          />
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
              placeholder="仅登记 voucherNo 凭证编号，不上传或下载附件"
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
      description: "后端状态为逾期，或待缴且截止日期早于今天。",
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

export const canManageDepartmentFees = (
  authUser: FeePermissionContext,
): boolean => Boolean(authUser?.permissionCodes.includes("fee:manage_department"));

export const shouldShowFeeDetailMarkPaidAction = (
  record: Pick<FeeRecord, "payStatus">,
  mode: FeeDetailContentMode = "management",
  canManageFees = true,
): boolean => mode === "management" && canManageFees && canMarkFeePaid(record);

export const mapFeeDetailErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "forbidden" || error.kind === "unauthorized") {
    return {
      ...error,
      message: "当前用户无权查看该费用详情",
      detail: error.detail ?? "请切换具备费用读取权限的演示用户后重试。",
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
      detail: error.detail ?? "请切换具备费用管理权限的演示用户后重试。",
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

const buildFeeColumns = (
  onOpenDetail: (record: FeeRecord) => void,
  onOpenMarkPaid: (record: FeeRecord) => void,
  canManageFees = true,
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
