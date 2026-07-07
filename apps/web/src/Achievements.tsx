import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AchievementDetail } from "./AchievementDetail";
import { AchievementForm, isEditableAchievementStatus } from "./AchievementForm";
import {
  createApiClient,
  isApiError,
  type AccountManagementApiClient,
  type ApiClient,
  type ApiError,
  type ApiQuery,
  type AuthUser,
} from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { sanitizeBusinessTitle } from "./display-text";
import { downloadCsvExport, downloadXlsxExport } from "./export-download";
import { ImportJobHistoryPanel, type ImportJobHistoryFilters } from "./ImportJobHistoryPanel";
import {
  ImportDryRunPanelShell,
  ImportDryRunResultShell,
  ImportDryRunStatusTag,
  renderImportDryRunIssueList,
  validateImportDryRunCsvFile,
} from "./importDryRunUi";
import type {
  AchievementImportApplyResult,
  AchievementImportDryRunIssue,
  AchievementImportDryRunResult,
  AchievementImportDryRunRow,
  AchievementListItem,
  AchievementListQuery,
  AchievementListResult,
  AchievementStatusCode,
  AchievementTypeCode,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type AchievementFilters = {
  keyword?: string;
  status?: AchievementStatusCode;
  type?: AchievementTypeCode;
};

type AchievementExportField =
  | "id"
  | "type"
  | "title"
  | "status"
  | "secretLevel"
  | "departmentId"
  | "createdAt"
  | "updatedAt"
  | "submittedAt"
  | "archivedAt"
  | "voidedAt"
  | "isRestricted"
  | "isRedacted";

type AchievementsProps = {
  demoUserId: string | null;
  authUser?: AchievementPermissionContext;
};

type AchievementPermissionContext = Pick<AuthUser, "id" | "permissionCodes"> | null | undefined;

type AchievementImportFileFingerprint = {
  fileName: string;
  fileSize: number;
  lastModified: number;
  resultFileName: string;
  resultFileSize: number;
  resultEncoding: string;
};

type AchievementImportApplyEligibleType = "PAPER" | "SOFTWARE_COPYRIGHT" | "PATENT";

type AchievementImportApplyEligibility = {
  eligible: boolean;
  reason: string;
  applyType: AchievementImportApplyEligibleType | null;
};

type FormRequest =
  | {
      mode: "create";
    }
  | {
      achievementId: string;
      mode: "edit";
    };

const defaultPageSize = 20;

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const typeOptions: Array<{ label: string; value: AchievementTypeCode }> = [
  { label: "论文", value: "PAPER" },
  { label: "专利", value: "PATENT" },
  { label: "软件著作权", value: "SOFTWARE_COPYRIGHT" },
];

const statusOptions: Array<{ label: string; value: AchievementStatusCode }> = [
  { label: "草稿", value: "DRAFT" },
  { label: "待院系审核", value: "PENDING_DEPARTMENT_REVIEW" },
  { label: "院系驳回", value: "DEPARTMENT_REJECTED" },
  { label: "待归档", value: "PENDING_ARCHIVE" },
  { label: "已归档", value: "ARCHIVED" },
  { label: "已作废", value: "VOIDED" },
];

const typeLabels = Object.fromEntries(
  typeOptions.map((option) => [option.value, option.label]),
) as Record<AchievementTypeCode, string>;

const statusLabels = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
) as Record<AchievementStatusCode, string>;

const secretLevelLabels: Record<AchievementListItem["secretLevel"], string> = {
  PUBLIC: "公开",
  INTERNAL: "内部",
  SECRET: "秘密",
  CONFIDENTIAL: "机密",
};

export const achievementImportHistoryFilters: ImportJobHistoryFilters = {
  family: "ACHIEVEMENT",
  mode: "CREATE_DRAFT_ONLY",
};

export function Achievements({ demoUserId, authUser }: AchievementsProps) {
  const [draftFilters, setDraftFilters] = useState<AchievementFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AchievementFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [achievements, setAchievements] =
    useState<Loadable<AchievementListResult>>(emptyLoadable);
  const [exportState, setExportState] = useState<{ loading: boolean; error: ApiError | null }>({
    loading: false,
    error: null,
  });
  const [exportFields, setExportFields] = useState<AchievementExportField[]>(
    defaultAchievementExportFields,
  );
  const [formRequest, setFormRequest] = useState<FormRequest | null>(null);
  const [detailItem, setDetailItem] = useState<AchievementListItem | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<ApiError | null>(null);
  const [importResult, setImportResult] = useState<AchievementImportDryRunResult | null>(
    null,
  );
  const [importFingerprint, setImportFingerprint] =
    useState<AchievementImportFileFingerprint | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [applyError, setApplyError] = useState<ApiError | null>(null);
  const [applyResult, setApplyResult] = useState<AchievementImportApplyResult | null>(null);
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const query = useMemo(
    () => buildAchievementListQuery(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize],
  );

  const loadAchievements = useCallback(() => {
    if (!demoUserId) {
      setAchievements(emptyLoadable);
      return;
    }

    setAchievements({ loading: true, data: null, error: null });
    void fetchAchievementList(apiClient, query)
      .then((data) => setAchievements({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setAchievements({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, demoUserId, query]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(trimFilters(draftFilters));
  };

  const resetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
    setPage(1);
    setPageSize(defaultPageSize);
  };

  const exportLedger = (format: AchievementExportFormat) => {
    setExportState({ loading: true, error: null });
    void exportAchievementLedger(apiClient, appliedFilters, format, exportFields)
      .then(() => setExportState({ loading: false, error: null }))
      .catch((error: unknown) =>
        setExportState({ loading: false, error: normalizeError(error) }),
      );
  };

  const hasFilters = hasActiveFilters(appliedFilters);
  const items = achievements.data?.items ?? [];
  const canUseImportDryRun = hasAchievementImportDryRunPermission(authUser);
  const applyEligibility = useMemo(
    () =>
      getAchievementImportApplyEligibility({
        authUser,
        file: importFile,
        result: importResult,
        fingerprint: importFingerprint,
        dryRunLoading: importLoading,
        applySubmitting,
      }),
    [applySubmitting, authUser, importFile, importLoading, importFingerprint, importResult],
  );

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    setImportFile(nextFile);
    setImportResult(null);
    setImportError(nextFile ? toValidationError(validateAchievementImportCsvFile(nextFile)) : null);
    setImportFingerprint(null);
    setApplyConfirmOpen(false);
    setApplyError(null);
    setApplyResult(null);
  };

  const runImportDryRun = () => {
    if (!importFile || importLoading) {
      return;
    }

    const validationMessage = validateAchievementImportCsvFile(importFile);

    if (validationMessage) {
      setImportError(toValidationError(validationMessage));
      setImportResult(null);
      setImportFingerprint(null);
      setApplyError(null);
      setApplyResult(null);
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportFingerprint(null);
    setApplyConfirmOpen(false);
    setApplyError(null);
    setApplyResult(null);
    void dryRunAchievementImport(apiClient, importFile)
      .then((result) => {
        setImportResult(result);
        setImportFingerprint(buildAchievementImportFileFingerprint(importFile, result));
        setImportError(null);
      })
      .catch((error: unknown) => {
        setImportResult(null);
        setImportFingerprint(null);
        setImportError(normalizeError(error));
      })
      .finally(() => setImportLoading(false));
  };

  const openApplyConfirm = () => {
    if (!applyEligibility.eligible) {
      setApplyError(toValidationError(applyEligibility.reason));
      return;
    }

    setApplyError(null);
    setApplyConfirmOpen(true);
  };

  const confirmApplyImport = () => {
    if (!importFile || applySubmitting) {
      return;
    }

    const currentEligibility = getAchievementImportApplyEligibility({
      authUser,
      file: importFile,
      result: importResult,
      fingerprint: importFingerprint,
      dryRunLoading: importLoading,
      applySubmitting,
    });

    if (!currentEligibility.eligible) {
      setApplyError(toValidationError(currentEligibility.reason));
      setApplyConfirmOpen(false);
      return;
    }

    setApplySubmitting(true);
    setApplyError(null);
    void applyAchievementImport(apiClient, importFile)
      .then((result) => {
        setApplyResult(result);
        setApplyError(null);
        setApplyConfirmOpen(false);
        loadAchievements();
      })
      .catch((error: unknown) => {
        setApplyResult(null);
        setApplyError(normalizeError(error));
      })
      .finally(() => setApplySubmitting(false));
  };

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="成果管理"
          description="请选择业务用户后查看成果列表。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，成果管理不会加载业务数据。请选择有权限的用户后继续。"
        />
        <BoundaryNotice
          title="请选择业务用户"
          description="选择用户后即可查看权限范围内的成果列表和操作入口。"
          step="成果管理"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="成果管理"
        description="查看当前账号权限范围内的成果列表，支持筛选、分页和摘要展示。"
        extra={
          canCreateAchievementDraft(authUser) ? (
            <Button type="primary" onClick={() => setFormRequest({ mode: "create" })}>
              登记成果
            </Button>
          ) : undefined
        }
      />
      <PermissionHint description="系统已按当前账号权限过滤成果数据。" />
      {exportState.error ? (
        <Typography.Text type="danger">{exportState.error.message}</Typography.Text>
      ) : null}

      {canUseImportDryRun ? (
        <>
          <AchievementImportDryRunPanel
            file={importFile}
            loading={importLoading}
            error={importError}
            result={importResult}
            applyEligibility={applyEligibility}
            applySubmitting={applySubmitting}
            applyConfirmOpen={applyConfirmOpen}
            applyError={applyError}
            applyResult={applyResult}
            onFileChange={handleImportFileChange}
            onRunDryRun={runImportDryRun}
            onOpenApplyConfirm={openApplyConfirm}
            onCancelApplyConfirm={() => setApplyConfirmOpen(false)}
            onConfirmApply={confirmApplyImport}
          />
          <ImportJobHistoryPanel
            apiClient={apiClient}
            title="成果导入记录"
            filters={achievementImportHistoryFilters}
            achievementTypeFilter
          />
        </>
      ) : null}

      <Card className="shell-card">
        <Space className="achievement-filter-bar" size={12} wrap>
          <Input.Search
            allowClear
            className="achievement-keyword"
            placeholder="按标题关键词筛选"
            enterButton="查询"
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            allowClear
            className="achievement-filter-select"
            placeholder="成果类型"
            options={typeOptions}
            value={draftFilters.type}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, type: value }))
            }
          />
          <Select
            allowClear
            className="achievement-filter-select"
            placeholder="成果状态"
            options={statusOptions}
            value={draftFilters.status}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, status: value }))
            }
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadAchievements}>刷新</Button>
          <Select<AchievementExportField[]>
            mode="multiple"
            className="achievement-filter-select"
            placeholder="导出字段"
            maxTagCount="responsive"
            options={achievementExportFieldOptions}
            value={exportFields}
            onChange={(value) => setExportFields(value.length > 0 ? value : defaultAchievementExportFields)}
          />
          <Button onClick={() => exportLedger("csv")} loading={exportState.loading}>
            导出 CSV
          </Button>
          <Button onClick={() => exportLedger("xlsx")} loading={exportState.loading}>
            导出 Excel
          </Button>
        </Space>
      </Card>

      <Card className="shell-card" title="成果列表">
        <DataState
          loading={achievements.loading}
          error={achievements.error}
          empty={!achievements.loading && !achievements.error && items.length === 0}
          emptyText={hasFilters ? "没有匹配的成果" : "暂无成果"}
          onRetry={loadAchievements}
        >
          <Table<AchievementListItem>
            className="achievement-table"
            rowKey="id"
            columns={createColumns(
              (item) => setFormRequest({ achievementId: item.id, mode: "edit" }),
              setDetailItem,
              authUser,
            )}
            dataSource={items}
            pagination={{
              current: achievements.data?.page ?? page,
              pageSize: achievements.data?.pageSize ?? pageSize,
              total: achievements.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            scroll={{ x: 1120 }}
          />
        </DataState>
      </Card>

      {formRequest ? (
        <AchievementForm
          apiClient={apiClient}
          mode={formRequest.mode}
          open
          achievementId={
            formRequest.mode === "edit" ? formRequest.achievementId : undefined
          }
          onClose={() => setFormRequest(null)}
          onSaved={({ close }) => {
            loadAchievements();

            if (close) {
              setFormRequest(null);
            }
          }}
        />
      ) : null}

      {detailItem ? (
        <AchievementDetail
          apiClient={apiClient}
          authUser={authUser}
          demoUserId={demoUserId}
          listItem={detailItem}
          open
          onChanged={loadAchievements}
          onClose={() => setDetailItem(null)}
        />
      ) : null}
    </Space>
  );
}

export const buildAchievementListQuery = (
  filters: AchievementFilters,
  page: number,
  pageSize: number,
): AchievementListQuery => {
  const trimmed = trimFilters(filters);

  return {
    ...trimmed,
    page,
    pageSize,
  };
};

export const validateAchievementImportCsvFile = (
  file: Pick<File, "name" | "size" | "type">,
): string | null => validateImportDryRunCsvFile(file);

export const dryRunAchievementImport = async (
  client: Pick<AccountManagementApiClient, "dryRunAchievementImport">,
  file: File,
): Promise<AchievementImportDryRunResult> => client.dryRunAchievementImport({ file });

export const applyAchievementImport = async (
  client: Pick<AccountManagementApiClient, "applyAchievementImport">,
  file: File,
): Promise<AchievementImportApplyResult> =>
  client.applyAchievementImport({ file, mode: "CREATE_DRAFT_ONLY" });

export function AchievementImportDryRunPanel({
  file,
  loading,
  error,
  result,
  applyEligibility = {
    eligible: false,
    reason: "请先完成导入预检。",
    applyType: null,
  },
  applySubmitting = false,
  applyConfirmOpen = false,
  applyError = null,
  applyResult = null,
  onFileChange,
  onRunDryRun,
  onOpenApplyConfirm,
  onCancelApplyConfirm,
  onConfirmApply,
}: {
  file: File | null;
  loading: boolean;
  error: ApiError | null;
  result: AchievementImportDryRunResult | null;
  applyEligibility?: AchievementImportApplyEligibility;
  applySubmitting?: boolean;
  applyConfirmOpen?: boolean;
  applyError?: ApiError | null;
  applyResult?: AchievementImportApplyResult | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRunDryRun: () => void;
  onOpenApplyConfirm?: () => void;
  onCancelApplyConfirm?: () => void;
  onConfirmApply?: () => void;
}) {
  return (
    <>
      <ImportDryRunPanelShell
        className="shell-card achievement-import-precheck-card"
        title="成果导入预检"
        noticeMessage="上传 CSV 文件后，系统会先检查论文、专利和软件著作权数据。"
        noticeDescription="预检通过后，可导入为草稿。"
        fileAriaLabel="成果 CSV 文件"
        file={file}
        loading={loading}
        error={error}
        result={result}
        emptyHint="请选择一个 CSV 文件进行导入预检。"
        onFileChange={onFileChange}
        onRunDryRun={onRunDryRun}
        renderResult={(dryRunResult) => (
          <AchievementImportDryRunResultView result={dryRunResult} />
        )}
        controlsDisabled={applySubmitting}
        extraActions={
          onOpenApplyConfirm ? (
            <Button
              loading={applySubmitting}
              disabled={!applyEligibility.eligible}
              onClick={onOpenApplyConfirm}
            >
              导入为草稿
            </Button>
          ) : null
        }
        afterResult={
          <AchievementImportApplyStatus
            result={result}
            eligibility={applyEligibility}
            error={applyError}
            applyResult={applyResult}
          />
        }
      />
      <Modal
        title={`确认导入${formatAchievementImportApplyType(applyEligibility.applyType)}草稿`}
        open={applyConfirmOpen}
        okText={getAchievementImportApplyConfirmButtonText(applyEligibility.applyType)}
        cancelText="取消"
        confirmLoading={applySubmitting}
        onOk={onConfirmApply}
        onCancel={onCancelApplyConfirm}
      >
        <AchievementImportApplyConfirmation applyType={applyEligibility.applyType} />
      </Modal>
    </>
  );
}

export function AchievementImportDryRunResultView({
  result,
}: {
  result: AchievementImportDryRunResult;
}) {
  return (
    <ImportDryRunResultShell
      result={result}
      writeSafetyDescription="预检阶段只校验文件内容，暂不写入成果、附件、费用或审批数据。"
      extraAlerts={
        <Alert
          type="info"
          showIcon
          message="工号匹配暂不可用"
          description="当前预检使用负责人邮箱进行匹配，工号仅作为文件内校验参考。"
        />
      }
      summaryItems={[
        {
          label: "草稿候选",
          value: result.summary.createDraftCandidates,
        },
        {
          label: "文件内重复",
          value: result.summary.duplicateIdentifierRows,
        },
        {
          label: "系统内冲突",
          value: result.summary.dbConflictRows,
        },
        {
          label: "工号匹配",
          value: result.summary.ownerEmployeeNoLookup,
        },
      ]}
      tableColumns={achievementImportDryRunColumns}
      tableScrollX={1520}
      receivedColumnColor={(column) => (column === "(sensitive)" ? "red" : "geekblue")}
    />
  );
}

export function AchievementImportApplyConfirmation({
  applyType,
}: {
  applyType: AchievementImportApplyEligibleType | null;
}) {
  const typeLabel = formatAchievementImportApplyType(applyType);
  const detailLabel = getAchievementImportApplyDetailLabel(applyType);
  const boundaryLabel = getAchievementImportApplyBoundaryLabel(applyType);

  return (
    <Space direction="vertical" size={8}>
      <Typography.Paragraph>
        系统将创建{typeLabel}成果草稿，并写入{detailLabel}。
      </Typography.Paragraph>
      <Typography.Paragraph>
        导入前会重新校验 CSV 文件，确保实际写入结果以系统校验为准。
      </Typography.Paragraph>
      <Typography.Paragraph>
        重复导入判断将使用上传文件中的{boundaryLabel}。
      </Typography.Paragraph>
      <Typography.Paragraph>
        本次操作只创建草稿，不会自动提交审批、创建附件、费用、提醒或授权记录。
      </Typography.Paragraph>
      {applyType === "SOFTWARE_COPYRIGHT" ? (
        <Typography.Paragraph>
          软件著作权费用和提醒不会在草稿导入时自动创建。
        </Typography.Paragraph>
      ) : null}
      {applyType === "PATENT" ? (
        <>
          <Typography.Paragraph>
            专利明细、贡献人和安全审计摘要仅会随专利草稿创建。
          </Typography.Paragraph>
          <Typography.Paragraph>
            授权号仅作为申请号存在时的辅助冲突判断依据。
          </Typography.Paragraph>
          <Typography.Paragraph>
            下次缴费日期和费用金额不会在草稿导入时写入，也不会自动生成费用或提醒记录。
          </Typography.Paragraph>
        </>
      ) : null}
    </Space>
  );
}

function AchievementImportApplyStatus({
  result,
  eligibility,
  error,
  applyResult,
}: {
  result: AchievementImportDryRunResult | null;
  eligibility: AchievementImportApplyEligibility;
  error: ApiError | null;
  applyResult: AchievementImportApplyResult | null;
}) {
  if (!result && !error && !applyResult) {
    return null;
  }

  return (
    <Space direction="vertical" size={8} className="full-width">
      {result && !eligibility.eligible ? (
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            预检通过后可导入为草稿
          </Typography.Text>
          <Typography.Text type="secondary">{eligibility.reason}</Typography.Text>
        </div>
      ) : null}
      {result && eligibility.eligible && eligibility.applyType ? (
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            可以导入为草稿
          </Typography.Text>
          <Space size={6} wrap>
            <Tag color="blue">{eligibility.applyType}</Tag>
            <Typography.Text type="secondary">{eligibility.reason}</Typography.Text>
          </Space>
        </div>
      ) : null}
      {error ? <AchievementImportApplyErrorView error={error} /> : null}
      {applyResult ? <AchievementImportApplyResultView result={applyResult} /> : null}
    </Space>
  );
}

export function AchievementImportApplyResultView({
  result,
}: {
  result: AchievementImportApplyResult;
}) {
  const applyType = getAchievementImportApplyResultType(result);
  const showPaperCount =
    applyType === "PAPER" || result.summary.createdPaperDetailsCount > 0;
  const showSoftwareCount =
    applyType === "SOFTWARE_COPYRIGHT" ||
    result.summary.createdSoftwareCopyrightDetailsCount > 0;
  const showPatentCount =
    applyType === "PATENT" || result.summary.createdPatentDetailsCount > 0;
  const createdAuditEventsCount =
    result.summary.createdAuditEventsCount ?? result.rows.length;

  return (
    <Alert
      type="success"
      showIcon
      message={`${formatAchievementImportApplyType(applyType)}草稿导入已完成`}
      description={
        <Space direction="vertical" size={8} className="full-width">
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="执行模式">
              {getAchievementImportModeLabel(result.mode)}
            </Descriptions.Item>
            <Descriptions.Item label="总行数">
              {result.summary.totalRows}
            </Descriptions.Item>
            <Descriptions.Item label="创建成果数">
              {result.summary.createdAchievementsCount}
            </Descriptions.Item>
            {showPaperCount ? (
              <Descriptions.Item label="论文明细数">
                {result.summary.createdPaperDetailsCount}
              </Descriptions.Item>
            ) : null}
            {showSoftwareCount ? (
              <Descriptions.Item label="软件著作权明细数">
                {result.summary.createdSoftwareCopyrightDetailsCount}
              </Descriptions.Item>
            ) : null}
            {showPatentCount ? (
              <Descriptions.Item label="专利明细数">
                {result.summary.createdPatentDetailsCount}
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label="贡献人记录数">
              {result.summary.createdContributorsCount}
            </Descriptions.Item>
            <Descriptions.Item label="审计记录数">
              {createdAuditEventsCount}
            </Descriptions.Item>
            <Descriptions.Item label="审计动作">
              {getAchievementImportAuditOperationLabel(result.summary.auditOperation)}
            </Descriptions.Item>
          </Descriptions>
          <Space size={6} wrap>
            <Tag>仅生成草稿</Tag>
            <Tag>不触发审批流</Tag>
            <Tag>不处理附件或存储</Tag>
            <Tag>不处理费用或提醒</Tag>
            <Tag>不触发通知、检索或资源授权</Tag>
            <Tag>不创建导入任务</Tag>
          </Space>
        </Space>
      }
    />
  );
}

export function AchievementImportApplyErrorView({ error }: { error: ApiError }) {
  const summary = getAchievementImportApplyErrorSummary(error);

  return (
    <Alert
      type="error"
      showIcon
      message={summary.message}
      description={
        <Space direction="vertical" size={4}>
          <Typography.Text>{summary.description}</Typography.Text>
          {summary.codes.length > 0 ? (
            <Space size={4} wrap>
              {summary.codes.map((code) => (
                <Tag key={code} color="red">
                  {code}
                </Tag>
              ))}
            </Space>
          ) : null}
        </Space>
      }
    />
  );
}

const formatAchievementImportApplyType = (
  applyType: AchievementImportApplyEligibleType | null,
): string => {
  if (applyType === "PAPER") {
    return "论文";
  }

  if (applyType === "SOFTWARE_COPYRIGHT") {
    return "软件著作权";
  }

  if (applyType === "PATENT") {
    return "专利";
  }

  return "成果";
};

const getAchievementImportApplyConfirmButtonText = (
  applyType: AchievementImportApplyEligibleType | null,
): string =>
  applyType === "SOFTWARE_COPYRIGHT"
    ? "创建软件著作权草稿"
    : applyType === "PATENT"
      ? "创建专利草稿"
    : "创建论文草稿";

const getAchievementImportApplyDetailLabel = (
  applyType: AchievementImportApplyEligibleType | null,
): string => {
  if (applyType === "SOFTWARE_COPYRIGHT") {
    return "软件著作权明细";
  }

  if (applyType === "PATENT") {
    return "专利明细";
  }

  return "论文明细";
};

const getAchievementImportApplyBoundaryLabel = (
  applyType: AchievementImportApplyEligibleType | null,
): string => {
  if (applyType === "SOFTWARE_COPYRIGHT") {
    return "标准化软件登记号";
  }

  if (applyType === "PATENT") {
    return "标准化申请号";
  }

  return "标准化 DOI";
};

const getAchievementImportModeLabel = (mode: AchievementImportApplyResult["mode"]): string =>
  mode === "CREATE_DRAFT_ONLY" ? "仅创建草稿" : mode;

const getAchievementImportAuditOperationLabel = (operation: string): string =>
  operation === "ACHIEVEMENT_IMPORT_CREATE_DRAFT" ? "创建成果草稿" : operation;

const getAchievementImportApplyResultType = (
  result: AchievementImportApplyResult,
): AchievementImportApplyEligibleType | null => {
  const rowTypes = new Set(result.rows.map((row) => row.type));

  if (rowTypes.size === 1 && rowTypes.has("PAPER")) {
    return "PAPER";
  }

  if (rowTypes.size === 1 && rowTypes.has("SOFTWARE_COPYRIGHT")) {
    return "SOFTWARE_COPYRIGHT";
  }

  if (rowTypes.size === 1 && rowTypes.has("PATENT")) {
    return "PATENT";
  }

  if (
    result.summary.createdPatentDetailsCount > 0 &&
    result.summary.createdPaperDetailsCount === 0 &&
    result.summary.createdSoftwareCopyrightDetailsCount === 0
  ) {
    return "PATENT";
  }

  if (
    result.summary.createdSoftwareCopyrightDetailsCount > 0 &&
    result.summary.createdPaperDetailsCount === 0 &&
    result.summary.createdPatentDetailsCount === 0
  ) {
    return "SOFTWARE_COPYRIGHT";
  }

  if (
    result.summary.createdPaperDetailsCount > 0 &&
    result.summary.createdSoftwareCopyrightDetailsCount === 0 &&
    result.summary.createdPatentDetailsCount === 0
  ) {
    return "PAPER";
  }

  return null;
};

export const buildAchievementImportFileFingerprint = (
  file: File,
  result: AchievementImportDryRunResult,
): AchievementImportFileFingerprint => ({
  fileName: file.name,
  fileSize: file.size,
  lastModified: file.lastModified,
  resultFileName: result.file.name,
  resultFileSize: result.file.size,
  resultEncoding: result.file.encoding,
});

export const isAchievementImportFileFingerprintMatch = (
  file: File | null,
  result: AchievementImportDryRunResult | null,
  fingerprint: AchievementImportFileFingerprint | null,
): boolean =>
  Boolean(
    file &&
      result &&
      fingerprint &&
      fingerprint.fileName === file.name &&
      fingerprint.fileSize === file.size &&
      fingerprint.lastModified === file.lastModified &&
      fingerprint.resultFileName === result.file.name &&
      fingerprint.resultFileSize === result.file.size &&
      fingerprint.resultEncoding === result.file.encoding,
  );

export const getAchievementImportApplyEligibility = ({
  authUser,
  file,
  result,
  fingerprint,
  dryRunLoading,
  applySubmitting,
}: {
  authUser: AchievementPermissionContext;
  file: File | null;
  result: AchievementImportDryRunResult | null;
  fingerprint: AchievementImportFileFingerprint | null;
  dryRunLoading: boolean;
  applySubmitting: boolean;
}): AchievementImportApplyEligibility => {
  if (!hasAchievementImportDryRunPermission(authUser)) {
    return {
      eligible: false,
      reason: "需要系统配置权限。",
      applyType: null,
    };
  }

  if (!file) {
    return {
      eligible: false,
      reason: "请选择与预检一致的 CSV 文件。",
      applyType: null,
    };
  }

  if (!result) {
    return {
      eligible: false,
      reason: "请先完成导入预检。",
      applyType: null,
    };
  }

  if (!isAchievementImportFileFingerprintMatch(file, result, fingerprint)) {
    return {
      eligible: false,
      reason: "文件已变更，请重新预检。",
      applyType: null,
    };
  }

  if (dryRunLoading || applySubmitting) {
    return {
      eligible: false,
      reason: "导入请求正在执行，请等待当前操作完成。",
      applyType: null,
    };
  }

  if (
    result.importType !== "ACHIEVEMENT" ||
    result.dryRun !== true ||
    result.summary.totalRows <= 0 ||
    result.summary.validRows !== result.summary.totalRows
  ) {
    return {
      eligible: false,
      reason: "导入预检未产生全部有效的结果。",
      applyType: null,
    };
  }

  if (result.summary.errorRows > 0 || result.rows.some((row) => row.errors.length > 0)) {
    return {
      eligible: false,
      reason: "请先修复导入预检错误。",
      applyType: null,
    };
  }

  if (
    result.summary.warningRows > 0 ||
    result.summary.duplicateIdentifierRows > 0 ||
    result.summary.dbConflictRows > 0 ||
    result.rows.some((row) => row.warnings.length > 0)
  ) {
    return {
      eligible: false,
      reason: "请先处理导入预检警告或数据库冲突行。",
      applyType: null,
    };
  }

  if (
    result.summary.createDraftCandidates !== result.summary.totalRows ||
    result.rows.some((row) => row.status !== "VALID" || row.candidateAction !== "CREATE_DRAFT")
  ) {
    return {
      eligible: false,
      reason: "只能导入创建草稿候选行。",
      applyType: null,
    };
  }

  const applyTypes = new Set(result.rows.map((row) => row.parsed.type));
  const hasPaper = applyTypes.has("PAPER");
  const hasSoftwareCopyright = applyTypes.has("SOFTWARE_COPYRIGHT");
  const hasPatent = applyTypes.has("PATENT");

  if (applyTypes.size !== 1) {
    return {
      eligible: false,
      reason: "不同成果类型需要拆分为不同批次后再导入。",
      applyType: null,
    };
  }

  if (hasPaper && applyTypes.size === 1) {
    if (result.rows.some((row) => !row.parsed.normalizedIdentifiers.doi)) {
      return {
        eligible: false,
        reason: "每一行论文都必须具备规范化 DOI。",
        applyType: null,
      };
    }

    return {
      eligible: true,
      reason: "可以创建论文草稿成果。",
      applyType: "PAPER",
    };
  }

  if (hasSoftwareCopyright && applyTypes.size === 1) {
    if (result.rows.some((row) => !row.parsed.normalizedIdentifiers.registrationNo)) {
      return {
        eligible: false,
        reason:
          "每一行软件著作权都必须具备规范化登记号。",
        applyType: null,
      };
    }

    return {
      eligible: true,
      reason: "可以创建软件著作权草稿成果。",
      applyType: "SOFTWARE_COPYRIGHT",
    };
  }

  if (hasPatent && applyTypes.size === 1) {
    if (
      result.rows.some(
        (row) =>
          row.parsed.normalizedIdentifiers.patentNo &&
          !row.parsed.normalizedIdentifiers.applicationNo,
      )
    ) {
      return {
        eligible: false,
        reason: "专利授权行必须先具备规范化申请号。",
        applyType: null,
      };
    }

    if (result.rows.some((row) => !row.parsed.normalizedIdentifiers.applicationNo)) {
      return {
        eligible: false,
        reason: "每一行专利都必须具备规范化申请号。",
        applyType: null,
      };
    }

    return {
      eligible: true,
      reason: "可以创建专利草稿成果。",
      applyType: "PATENT",
    };
  }

  return {
    eligible: false,
    reason: "每次只能导入同一类成果。",
    applyType: null,
  };
};

const getAchievementImportApplyErrorSummary = (
  error: ApiError,
): { message: string; description: string; codes: string[] } => {
  const body = error.body as
    | {
        summary?: {
          failedRows?: number;
          errorCount?: number;
          warningCount?: number;
        };
        errors?: Array<{
          code?: unknown;
        }>;
      }
    | undefined;
  const codes = Array.from(
    new Set(
      (Array.isArray(body?.errors) ? body.errors : [])
        .map((item) => (typeof item.code === "string" ? item.code : null))
        .filter((code): code is string => Boolean(code)),
    ),
  );

  if (error.kind === "unauthorized") {
    return {
      message: "需要有效登录状态",
      description: "请先选择或刷新当前业务用户后再导入。",
      codes,
    };
  }

  if (error.kind === "forbidden") {
    return {
      message: "当前角色无权导入",
      description: "该导入操作需要系统配置权限。",
      codes,
    };
  }

  const failedRows =
    typeof body?.summary?.failedRows === "number" ? body.summary.failedRows : null;
  const errorCount =
    typeof body?.summary?.errorCount === "number" ? body.summary.errorCount : null;
  const warningCount =
    typeof body?.summary?.warningCount === "number" ? body.summary.warningCount : null;
  const countText =
    failedRows !== null || errorCount !== null || warningCount !== null
      ? `被拒绝行数：${failedRows ?? "未返回"}；错误：${errorCount ?? "未返回"}；警告：${warningCount ?? "未返回"}。`
      : "本次导入请求未通过。";

  return {
    message: "导入被拒绝",
    description: `${countText} 如有校验代码，页面会一并展示。`,
    codes,
  };
};

const achievementImportDryRunColumns: TableProps<AchievementImportDryRunRow>["columns"] = [
  {
    title: "行号",
    dataIndex: "rowNumber",
    key: "rowNumber",
    width: 72,
  },
  {
    title: "安全预览",
    key: "parsed",
    width: 390,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>成果类型：{getAchievementImportTypeLabel(row.parsed.type)}</Typography.Text>
        <Typography.Text>标题：{row.parsed.title ?? "-"}</Typography.Text>
        <Typography.Text>部门编码：{row.parsed.departmentCode ?? "-"}</Typography.Text>
        <Typography.Text>
          负责人：{row.parsed.ownerEmail ?? row.parsed.ownerEmployeeNo ?? "-"}
        </Typography.Text>
        <Typography.Text>状态：{getAchievementImportStatusLabel(row.parsed.status)}</Typography.Text>
        <Typography.Text>密级：{getAchievementImportSecretLevelLabel(row.parsed.secretLevel)}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "贡献人",
    key: "contributors",
    width: 330,
    render: (_, row) => renderContributorPreview(row),
  },
  {
    title: "规范化标识",
    key: "normalizedIdentifiers",
    width: 330,
    render: (_, row) => renderIdentifierList(row),
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: AchievementImportDryRunRow["status"]) => (
      <ImportDryRunStatusTag status={status} />
    ),
  },
  {
    title: "候选动作",
    dataIndex: "candidateAction",
    key: "candidateAction",
    width: 152,
    render: (value: string) => getAchievementImportCandidateActionLabel(value),
  },
  {
    title: "错误",
    dataIndex: "errors",
    key: "errors",
    width: 310,
    render: (issues: AchievementImportDryRunIssue[]) =>
      renderImportDryRunIssueList(issues, "error"),
  },
  {
    title: "警告",
    dataIndex: "warnings",
    key: "warnings",
    width: 310,
    render: (issues: AchievementImportDryRunIssue[]) =>
      renderImportDryRunIssueList(issues, "warning"),
  },
];

const achievementExportFieldOptions: Array<{ label: string; value: AchievementExportField }> = [
  { label: "ID", value: "id" },
  { label: "成果类型", value: "type" },
  { label: "标题", value: "title" },
  { label: "状态", value: "status" },
  { label: "密级", value: "secretLevel" },
  { label: "部门 ID", value: "departmentId" },
  { label: "创建时间", value: "createdAt" },
  { label: "更新时间", value: "updatedAt" },
  { label: "提交时间", value: "submittedAt" },
  { label: "归档时间", value: "archivedAt" },
  { label: "作废时间", value: "voidedAt" },
  { label: "受限标记", value: "isRestricted" },
  { label: "脱敏标记", value: "isRedacted" },
];

const defaultAchievementExportFields = achievementExportFieldOptions.map(
  (option) => option.value,
);

const renderContributorPreview = (row: AchievementImportDryRunRow) => {
  if (row.parsed.contributors.length === 0) {
    return <Typography.Text type="secondary">无</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={4}>
      {row.parsed.contributors.map((contributor, index) => (
        <Typography.Text key={`${row.rowNumber}-contributor-${index}`}>
          {`${contributor.sortOrder}. ${contributor.name ?? "-"} / ${contributor.contributorType ?? "-"} / ${contributor.contributorRole ?? "-"} / ${contributor.userEmail ?? contributor.organization ?? "-"}`}
        </Typography.Text>
      ))}
    </Space>
  );
};

const renderIdentifierList = (row: AchievementImportDryRunRow) => {
  const entries = Object.entries(row.parsed.normalizedIdentifiers).filter(
    ([, value]) => value,
  );

  if (entries.length === 0) {
    return <Typography.Text type="secondary">无</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={4}>
      {entries.map(([field, value]) => {
        const hasFileDuplicate = row.errors.some(
          (issue) => issue.field === field && issue.code === "DUPLICATE_IN_FILE",
        );
        const hasDbConflict = row.warnings.some(
          (issue) => issue.field === field && issue.code === "DB_CONFLICT",
        );

        return (
          <span key={`${row.rowNumber}-${field}`}>
            <Tag color={hasFileDuplicate ? "red" : hasDbConflict ? "gold" : "blue"}>
              {getAchievementImportIdentifierLabel(field)}
            </Tag>
            <Typography.Text>{value}</Typography.Text>
          </span>
        );
      })}
    </Space>
  );
};

const getAchievementImportStatusLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const labels: Record<string, string> = {
    DRAFT: "草稿",
    SUBMITTED: "已提交",
    APPROVED: "已通过",
    REJECTED: "已驳回",
    ARCHIVED: "已归档",
  };

  return labels[value] ?? value;
};

const getAchievementImportTypeLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const labels: Record<string, string> = {
    PAPER: "论文",
    SOFTWARE_COPYRIGHT: "软件著作权",
    PATENT: "专利",
  };

  return labels[value] ?? value;
};

const getAchievementImportSecretLevelLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const labels: Record<string, string> = {
    PUBLIC: "公开",
    INTERNAL: "内部",
    CONFIDENTIAL: "机密",
    SECRET: "秘密",
  };

  return labels[value] ?? value;
};

const getAchievementImportCandidateActionLabel = (value: string): string => {
  const labels: Record<string, string> = {
    CREATE_DRAFT: "创建草稿",
    SKIP: "跳过",
  };

  return labels[value] ?? value;
};

const getAchievementImportIdentifierLabel = (value: string): string => {
  const labels: Record<string, string> = {
    doi: "DOI",
    applicationNo: "申请号",
    patentNo: "授权号",
    registrationNo: "登记号",
  };

  return labels[value] ?? value;
};

export const getAchievementDisplayTitle = (item: Pick<AchievementListItem, "title" | "isRedacted">) => {
  if (item.title) {
    return sanitizeBusinessTitle(item.title, "成果记录");
  }

  return item.isRedacted ? "已脱敏成果" : "未命名成果";
};

export const isAchievementTitleRedacted = (
  item: Pick<AchievementListItem, "title" | "isRedacted">,
): boolean => item.title === null && item.isRedacted;

const hasAchievementPermission = (
  authUser: AchievementPermissionContext,
  permissionCode: string,
): boolean => !authUser || authUser.permissionCodes.includes(permissionCode);

export const hasAchievementImportDryRunPermission = (
  authUser: AchievementPermissionContext,
): boolean => Boolean(authUser?.permissionCodes.includes("system:config"));

export const canCreateAchievementDraft = (
  authUser: AchievementPermissionContext,
): boolean => hasAchievementPermission(authUser, "achievement:create");

export const canEditAchievementDraft = (
  authUser: AchievementPermissionContext,
  item: Pick<AchievementListItem, "ownerUserId" | "status">,
): boolean =>
  hasAchievementPermission(authUser, "achievement:update_own") &&
  (!authUser || item.ownerUserId === authUser.id) &&
  isEditableAchievementStatus(item.status);

const canSeeRejectedDraftEditBoundary = (
  authUser: AchievementPermissionContext,
  item: Pick<AchievementListItem, "ownerUserId" | "status">,
): boolean =>
  hasAchievementPermission(authUser, "achievement:update_own") &&
  (!authUser || item.ownerUserId === authUser.id) &&
  item.status === "DEPARTMENT_REJECTED";

const fetchAchievementList = async (
  client: ApiClient,
  query: AchievementListQuery,
): Promise<AchievementListResult> => {
  const result = await client.get<Partial<AchievementListResult>>("/achievements", query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : query.page,
    pageSize: typeof result.pageSize === "number" ? result.pageSize : query.pageSize,
  };
};

export const exportAchievementCsv = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: AchievementFilters,
  fields: readonly AchievementExportField[] = defaultAchievementExportFields,
): Promise<void> =>
  exportAchievementLedger(client, filters, "csv", fields);

export const exportAchievementXlsx = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: AchievementFilters,
  fields: readonly AchievementExportField[] = defaultAchievementExportFields,
): Promise<void> =>
  exportAchievementLedger(client, filters, "xlsx", fields);

export const exportAchievementLedger = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: AchievementFilters,
  format: AchievementExportFormat,
  fields: readonly AchievementExportField[] = defaultAchievementExportFields,
): Promise<void> => {
  const path = `/achievements/export.${format}`;
  const fileName = `achievements.${format}`;
  const query = {
    ...trimFilters(filters),
    fields: serializeExportFields(fields),
  } as ApiQuery;

  if (format === "xlsx") {
    await downloadXlsxExport(client, path, query, fileName);
    return;
  }

  await downloadCsvExport(client, path, query, fileName);
};

type AchievementExportFormat = "csv" | "xlsx";

export const serializeAchievementExportFields = (
  fields: readonly AchievementExportField[],
): string => serializeExportFields(fields);

const serializeExportFields = (fields: readonly string[]): string =>
  [...new Set(fields)].join(",");

const trimFilters = (filters: AchievementFilters): AchievementFilters => {
  const keyword = filters.keyword?.trim();

  return {
    keyword: keyword || undefined,
    status: filters.status,
    type: filters.type,
  };
};

const hasActiveFilters = (filters: AchievementFilters): boolean =>
  Boolean(filters.keyword?.trim() || filters.status || filters.type);

const createColumns = (
  onEdit: (item: AchievementListItem) => void,
  onViewDetail: (item: AchievementListItem) => void,
  authUser?: AchievementPermissionContext,
): TableProps<AchievementListItem>["columns"] => [
  {
    title: "标题",
    dataIndex: "title",
    key: "title",
    width: 280,
    render: (_value, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong={!isAchievementTitleRedacted(item)}>
          {getAchievementDisplayTitle(item)}
        </Typography.Text>
        {item.isRedacted ? <Tag color="warning">已脱敏</Tag> : null}
      </Space>
    ),
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 136,
    render: (value: AchievementTypeCode) => typeLabels[value] ?? value,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 152,
    render: (value: AchievementStatusCode) => <Tag>{statusLabels[value] ?? value}</Tag>,
  },
  {
    title: "密级",
    dataIndex: "secretLevel",
    key: "secretLevel",
    width: 112,
    render: (value: AchievementListItem["secretLevel"], item) => (
      <Tag color={item.isRestricted ? "orange" : "default"}>
        {secretLevelLabels[value] ?? value}
      </Tag>
    ),
  },
  {
    title: "所属部门",
    dataIndex: "departmentId",
    key: "departmentId",
    width: 220,
    render: (value: string) => <Typography.Text ellipsis>{value}</Typography.Text>,
  },
  {
    title: "负责人",
    dataIndex: "ownerUserId",
    key: "ownerUserId",
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
    title: "状态时间",
    key: "stateTime",
    width: 176,
    render: (_, item) => formatDateTime(item.archivedAt ?? item.submittedAt ?? item.voidedAt),
  },
  {
    title: "操作入口",
    key: "actions",
    fixed: "right",
    width: 180,
    render: (_, item) => (
      <Space>
        {renderEditAction(item, onEdit, authUser)}
        <Button size="small" onClick={() => onViewDetail(item)}>
          查看详情
        </Button>
      </Space>
    ),
  },
];

const renderEditAction = (
  item: AchievementListItem,
  onEdit: (item: AchievementListItem) => void,
  authUser?: AchievementPermissionContext,
) => {
  if (canEditAchievementDraft(authUser, item)) {
    return (
      <Button size="small" type="link" onClick={() => onEdit(item)}>
        编辑草稿
      </Button>
    );
  }

  if (canSeeRejectedDraftEditBoundary(authUser, item)) {
    return (
      <Tooltip title="当前状态暂不支持编辑">
        <Button disabled size="small" type="link">
          编辑
        </Button>
      </Tooltip>
    );
  }

  return null;
};

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

const toValidationError = (message: string | null): ApiError | null =>
  message
    ? {
        kind: "bad-request",
        message,
      }
    : null;

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
