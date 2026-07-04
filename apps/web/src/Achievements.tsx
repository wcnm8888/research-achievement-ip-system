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
  type AuthUser,
} from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
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

type AchievementImportApplyEligibleType = "PAPER" | "SOFTWARE_COPYRIGHT";

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

export function Achievements({ demoUserId, authUser }: AchievementsProps) {
  const [draftFilters, setDraftFilters] = useState<AchievementFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AchievementFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [achievements, setAchievements] =
    useState<Loadable<AchievementListResult>>(emptyLoadable);
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
          description="选择本地演示用户后，前端才会请求后端成果列表。"
        />
        <PermissionHint description="当前没有 X-Demo-User-Id，成果管理不会发起业务请求。选择科研人员、科研秘书或系统管理员演示上下文后，列表会统一由后端权限策略裁剪。" />
        <BoundaryNotice
          title="等待演示上下文"
          description="Step 12D 已提供真实详情和动作入口；选择演示上下文后才能读取后端业务数据。"
          step="Step 12D"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="成果管理"
        description="读取后端 GET /achievements 的真实成果列表；筛选、分页和脱敏结果均以后端返回为准。"
        extra={
          canCreateAchievementDraft(authUser) ? (
            <Button type="primary" onClick={() => setFormRequest({ mode: "create" })}>
              登记成果
            </Button>
          ) : undefined
        }
      />
      <PermissionHint description="最终读取权限以后端策略为准。前端只负责传递 X-Demo-User-Id、展示后端返回的列表和脱敏状态，不在浏览器端承担最终鉴权。" />

      {canUseImportDryRun ? (
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
        </Space>
      </Card>

      <Card className="shell-card" title="成果列表" extra={<Tag>GET /achievements</Tag>}>
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
    reason: "Run a successful dry-run before applying.",
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
        className="shell-card achievement-import-dry-run-card"
        title="Achievement CSV dry-run"
        endpoint="POST /achievements/import/dry-run"
        noticeMessage="dryRun=true; CSV-only; validates PAPER, PATENT, and SOFTWARE_COPYRIGHT rows without writing achievements."
        noticeDescription="Attachments, fees, workflow, audit logging, and real import execution are outside this dry-run. The preview only shows sanitized fields returned by the API."
        fileAriaLabel="Achievement CSV file"
        file={file}
        loading={loading}
        error={error}
        result={result}
        emptyHint="Select one .csv file to preview achievement validation results."
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
              Apply draft-only import
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
        title={`Confirm draft-only ${formatAchievementImportApplyType(applyEligibility.applyType)} import`}
        open={applyConfirmOpen}
        okText={getAchievementImportApplyConfirmButtonText(applyEligibility.applyType)}
        cancelText="Cancel"
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
      writeSafetyDescription="no achievement, detail, contributor, attachment, fee, workflow, or audit writes were requested."
      extraAlerts={
        <Alert
          type="info"
          showIcon
          message="ownerEmployeeNo lookup: NOT_AVAILABLE"
          description="Use ownerEmail for owner resolution in this dry-run. ownerEmployeeNo is recognized only as an unsupported lookup boundary."
        />
      }
      summaryItems={[
        {
          label: "Draft candidates",
          value: result.summary.createDraftCandidates,
        },
        {
          label: "File duplicate conflicts",
          value: result.summary.duplicateIdentifierRows,
        },
        {
          label: "DB conflicts",
          value: result.summary.dbConflictRows,
        },
        {
          label: "ownerEmployeeNo lookup",
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
  const detailLabel =
    applyType === "SOFTWARE_COPYRIGHT"
      ? "software copyright detail rows"
      : "paper detail rows";
  const boundaryLabel =
    applyType === "SOFTWARE_COPYRIGHT"
      ? "normalized software registration number"
      : "normalized DOI";

  return (
    <Space direction="vertical" size={8}>
      <Typography.Paragraph>
        This creates DRAFT {typeLabel} achievements and {detailLabel} with mode
        CREATE_DRAFT_ONLY.
      </Typography.Paragraph>
      <Typography.Paragraph>
        The backend will re-read and validate the CSV before writing. The browser dry-run
        result is not trusted as an apply source of truth.
      </Typography.Paragraph>
      <Typography.Paragraph>
        The duplicate-apply boundary is the {boundaryLabel} from the uploaded CSV.
      </Typography.Paragraph>
      <Typography.Paragraph>
        It will not submit for approval, create workflow, attachment/storage, fee,
        reminder, notification, search, resource grant, or import job records.
      </Typography.Paragraph>
      {applyType === "SOFTWARE_COPYRIGHT" ? (
        <Typography.Paragraph>
          Software copyright fees and reminders are intentionally not created by this
          draft-only import.
        </Typography.Paragraph>
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
        <Alert
          type="warning"
          showIcon
          message="Apply is disabled"
          description={eligibility.reason}
        />
      ) : null}
      {result && eligibility.eligible && eligibility.applyType ? (
        <Alert
          type="info"
          showIcon
          message="Apply is ready"
          description={
            <Space size={6} wrap>
              <Tag color="blue">{eligibility.applyType}</Tag>
              <Typography.Text>{eligibility.reason}</Typography.Text>
            </Space>
          }
        />
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

  return (
    <Alert
      type="success"
      showIcon
      message={`Draft-only ${formatAchievementImportApplyType(applyType)} import applied`}
      description={
        <Space direction="vertical" size={8} className="full-width">
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="Mode">{result.mode}</Descriptions.Item>
            <Descriptions.Item label="Total rows">
              {result.summary.totalRows}
            </Descriptions.Item>
            <Descriptions.Item label="Created achievements">
              {result.summary.createdAchievementsCount}
            </Descriptions.Item>
            {showPaperCount ? (
              <Descriptions.Item label="Created paper details">
                {result.summary.createdPaperDetailsCount}
              </Descriptions.Item>
            ) : null}
            {showSoftwareCount ? (
              <Descriptions.Item label="Created software copyright details">
                {result.summary.createdSoftwareCopyrightDetailsCount}
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label="Created contributors">
              {result.summary.createdContributorsCount}
            </Descriptions.Item>
            <Descriptions.Item label="Audit operation">
              {result.summary.auditOperation}
            </Descriptions.Item>
          </Descriptions>
          <Space size={6} wrap>
            <Tag>DRAFT only</Tag>
            <Tag>No workflow</Tag>
            <Tag>No attachment/storage</Tag>
            <Tag>No fee/reminder</Tag>
            <Tag>No notification/search/resource grant</Tag>
            <Tag>No import job</Tag>
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
    return "PAPER";
  }

  if (applyType === "SOFTWARE_COPYRIGHT") {
    return "SOFTWARE_COPYRIGHT";
  }

  return "achievement";
};

const getAchievementImportApplyConfirmButtonText = (
  applyType: AchievementImportApplyEligibleType | null,
): string =>
  applyType === "SOFTWARE_COPYRIGHT"
    ? "Create DRAFT software copyright achievements"
    : "Create DRAFT PAPER achievements";

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

  if (
    result.summary.createdSoftwareCopyrightDetailsCount > 0 &&
    result.summary.createdPaperDetailsCount === 0
  ) {
    return "SOFTWARE_COPYRIGHT";
  }

  if (
    result.summary.createdPaperDetailsCount > 0 &&
    result.summary.createdSoftwareCopyrightDetailsCount === 0
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
      reason: "system:config permission is required.",
      applyType: null,
    };
  }

  if (!file) {
    return {
      eligible: false,
      reason: "Select the same CSV file used for dry-run.",
      applyType: null,
    };
  }

  if (!result) {
    return {
      eligible: false,
      reason: "Run a successful dry-run before applying.",
      applyType: null,
    };
  }

  if (!isAchievementImportFileFingerprintMatch(file, result, fingerprint)) {
    return {
      eligible: false,
      reason: "Selected file changed after dry-run.",
      applyType: null,
    };
  }

  if (dryRunLoading || applySubmitting) {
    return {
      eligible: false,
      reason: "An import request is already in progress.",
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
      reason: "Dry-run did not produce an all-valid result.",
      applyType: null,
    };
  }

  if (result.summary.errorRows > 0 || result.rows.some((row) => row.errors.length > 0)) {
    return {
      eligible: false,
      reason: "Dry-run errors must be fixed before apply.",
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
      reason: "Dry-run warnings or DB_CONFLICT rows must be fixed before apply.",
      applyType: null,
    };
  }

  if (
    result.summary.createDraftCandidates !== result.summary.totalRows ||
    result.rows.some((row) => row.status !== "VALID" || row.candidateAction !== "CREATE_DRAFT")
  ) {
    return {
      eligible: false,
      reason: "Only CREATE_DRAFT candidates can be applied.",
      applyType: null,
    };
  }

  if (result.rows.some((row) => row.parsed.type === "PATENT")) {
    return {
      eligible: false,
      reason: "PATENT apply is not enabled yet.",
      applyType: null,
    };
  }

  const applyTypes = new Set(result.rows.map((row) => row.parsed.type));
  const hasPaper = applyTypes.has("PAPER");
  const hasSoftwareCopyright = applyTypes.has("SOFTWARE_COPYRIGHT");

  if (hasPaper && hasSoftwareCopyright) {
    return {
      eligible: false,
      reason: "Mixed PAPER and SOFTWARE_COPYRIGHT batches must be split before apply.",
      applyType: null,
    };
  }

  if (hasPaper && applyTypes.size === 1) {
    if (result.rows.some((row) => !row.parsed.normalizedIdentifiers.doi)) {
      return {
        eligible: false,
        reason: "Every PAPER row must have a normalized DOI.",
        applyType: null,
      };
    }

    return {
      eligible: true,
      reason: "Ready to create DRAFT PAPER achievements.",
      applyType: "PAPER",
    };
  }

  if (hasSoftwareCopyright && applyTypes.size === 1) {
    if (result.rows.some((row) => !row.parsed.normalizedIdentifiers.registrationNo)) {
      return {
        eligible: false,
        reason:
          "Every SOFTWARE_COPYRIGHT row must have a normalized software registration number.",
        applyType: null,
      };
    }

    return {
      eligible: true,
      reason: "Ready to create DRAFT SOFTWARE_COPYRIGHT achievements.",
      applyType: "SOFTWARE_COPYRIGHT",
    };
  }

  return {
    eligible: false,
    reason: "Only all-PAPER or all-SOFTWARE_COPYRIGHT batches can be applied.",
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
      message: "Session required",
      description: "Select or refresh the demo user session before applying.",
      codes,
    };
  }

  if (error.kind === "forbidden") {
    return {
      message: "Permission denied",
      description: "system:config permission is required for this apply action.",
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
      ? `Rejected rows: ${failedRows ?? "unknown"}; errors: ${errorCount ?? "unknown"}; warnings: ${warningCount ?? "unknown"}.`
      : "The backend rejected the apply request.";

  return {
    message: "Apply rejected",
    description: `${countText} Safe error codes are shown when provided.`,
    codes,
  };
};

const achievementImportDryRunColumns: TableProps<AchievementImportDryRunRow>["columns"] = [
  {
    title: "Row",
    dataIndex: "rowNumber",
    key: "rowNumber",
    width: 72,
  },
  {
    title: "Safe preview",
    key: "parsed",
    width: 390,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>type: {row.parsed.type ?? "-"}</Typography.Text>
        <Typography.Text>title: {row.parsed.title ?? "-"}</Typography.Text>
        <Typography.Text>departmentCode: {row.parsed.departmentCode ?? "-"}</Typography.Text>
        <Typography.Text>
          owner: {row.parsed.ownerEmail ?? row.parsed.ownerEmployeeNo ?? "-"}
        </Typography.Text>
        <Typography.Text>status: {row.parsed.status ?? "-"}</Typography.Text>
        <Typography.Text>secretLevel: {row.parsed.secretLevel ?? "-"}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "Contributors",
    key: "contributors",
    width: 330,
    render: (_, row) => renderContributorPreview(row),
  },
  {
    title: "Normalized identifiers",
    key: "normalizedIdentifiers",
    width: 330,
    render: (_, row) => renderIdentifierList(row),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: AchievementImportDryRunRow["status"]) => (
      <ImportDryRunStatusTag status={status} />
    ),
  },
  {
    title: "Candidate",
    dataIndex: "candidateAction",
    key: "candidateAction",
    width: 152,
  },
  {
    title: "Errors",
    dataIndex: "errors",
    key: "errors",
    width: 310,
    render: (issues: AchievementImportDryRunIssue[]) =>
      renderImportDryRunIssueList(issues, "error"),
  },
  {
    title: "Warnings",
    dataIndex: "warnings",
    key: "warnings",
    width: 310,
    render: (issues: AchievementImportDryRunIssue[]) =>
      renderImportDryRunIssueList(issues, "warning"),
  },
];

const renderContributorPreview = (row: AchievementImportDryRunRow) => {
  if (row.parsed.contributors.length === 0) {
    return <Typography.Text type="secondary">None</Typography.Text>;
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
    return <Typography.Text type="secondary">None</Typography.Text>;
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
              {field}
            </Tag>
            <Typography.Text>{value}</Typography.Text>
          </span>
        );
      })}
    </Space>
  );
};

export const getAchievementDisplayTitle = (item: Pick<AchievementListItem, "title" | "isRedacted">) => {
  if (item.title) {
    return item.title;
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
        {item.isRedacted ? <Tag color="warning">后端脱敏</Tag> : null}
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
      <Tooltip title="当前后端暂不支持驳回后编辑">
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
