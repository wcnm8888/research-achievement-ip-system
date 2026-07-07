import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tree,
  Typography,
  message,
  type FormInstance,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  createApiClient,
  isApiError,
  type AccountManagementApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
import { hasSystemConfigPermission } from "./AccountManagement";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { ImportJobHistoryPanel, type ImportJobHistoryFilters } from "./ImportJobHistoryPanel";
import {
  ImportDryRunPanelShell,
  ImportDryRunResultShell,
  ImportDryRunStatusTag,
  renderImportDryRunIssueList,
  validateImportDryRunCsvFile,
} from "./importDryRunUi";
import type {
  CreateDepartmentInput,
  DepartmentDetail,
  DepartmentImpactSummary,
  DepartmentImportApplyMode,
  DepartmentImportApplyResult,
  DepartmentImportDryRunIssue,
  DepartmentImportDryRunResult,
  DepartmentImportDryRunRow,
  DepartmentListResponse,
  DepartmentReasonInput,
  DepartmentStatus,
  DepartmentSummary,
  DepartmentTreeNode,
  DepartmentTreeResponse,
  ListDepartmentsQuery,
  UpdateDepartmentInput,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type DepartmentFilters = {
  keyword?: string;
  status?: DepartmentStatus;
  includeArchived?: boolean;
};

type DepartmentFormValues = {
  code?: string;
  name?: string;
  parentId?: string | null;
};

type ReasonFormValues = {
  reason?: string;
};

type DepartmentFormMode =
  | { kind: "create" }
  | { kind: "edit"; department: DepartmentDetail };

type DepartmentOperation =
  | { kind: "disable"; department: DepartmentDetail }
  | { kind: "enable"; department: DepartmentDetail };

type DepartmentOperationResult =
  | { kind: "disable"; impactSummary: DepartmentImpactSummary }
  | { kind: "enable" };

type DepartmentImportApplyEligibility = {
  canApply: boolean;
  reason: string;
};

type DepartmentImportFileFingerprint = {
  name: string;
  size: number;
  lastModified: number;
  resultName: string;
  resultSize: number;
};

type DepartmentTreeDataNode = {
  key: string;
  title: React.ReactNode;
  children: DepartmentTreeDataNode[];
};

type DepartmentManagementProps = {
  demoUserId: string | null;
  authUser: Pick<AuthUser, "permissionCodes"> | null;
};

const defaultPageSize = 20;
const departmentImportApplyMode: DepartmentImportApplyMode = "CREATE_ONLY";
const departmentImportApplyAuditOperation = "DEPARTMENT_IMPORT_CREATE";
export const departmentImportHistoryFilters: ImportJobHistoryFilters = {
  family: "DEPARTMENT",
  mode: "CREATE_ONLY",
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const statusOptions: Array<{ label: string; value: DepartmentStatus }> = [
  { label: "启用", value: "ACTIVE" },
  { label: "归档/停用", value: "ARCHIVED" },
];

const statusLabels: Record<DepartmentStatus, string> = {
  ACTIVE: "启用",
  ARCHIVED: "归档/停用",
};

const impactSummaryLabels: Array<{
  key: keyof DepartmentImpactSummary;
  label: string;
  blocked: boolean;
}> = [
  { key: "activeUsersCount", label: "活跃用户", blocked: true },
  { key: "activeUserRoleScopesCount", label: "活跃角色部门 scope", blocked: true },
  { key: "pendingWorkflowTasksCount", label: "待处理审批任务", blocked: true },
  { key: "activeOrUnarchivedAchievementsCount", label: "活跃或未归档成果", blocked: false },
  { key: "feeRecordsCount", label: "费用记录", blocked: false },
];

export function DepartmentManagement({ demoUserId, authUser }: DepartmentManagementProps) {
  const [draftFilters, setDraftFilters] = useState<DepartmentFilters>({
    includeArchived: false,
  });
  const [appliedFilters, setAppliedFilters] = useState<DepartmentFilters>({
    includeArchived: false,
  });
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [departments, setDepartments] =
    useState<Loadable<DepartmentListResponse>>(emptyLoadable);
  const [tree, setTree] = useState<Loadable<DepartmentTreeResponse>>(emptyLoadable);
  const [detailDepartmentId, setDetailDepartmentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Loadable<DepartmentDetail>>(emptyLoadable);
  const [formMode, setFormMode] = useState<DepartmentFormMode | null>(null);
  const [operation, setOperation] = useState<DepartmentOperation | null>(null);
  const [operationResult, setOperationResult] = useState<DepartmentOperationResult | null>(null);
  const [operationError, setOperationError] = useState<ApiError | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<DepartmentImportDryRunResult | null>(null);
  const [importError, setImportError] = useState<ApiError | null>(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importApplySubmitting, setImportApplySubmitting] = useState(false);
  const [importApplyConfirmOpen, setImportApplyConfirmOpen] = useState(false);
  const [importApplyResult, setImportApplyResult] =
    useState<DepartmentImportApplyResult | null>(null);
  const [importApplyError, setImportApplyError] = useState<ApiError | null>(null);
  const [importFileFingerprint, setImportFileFingerprint] =
    useState<DepartmentImportFileFingerprint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [departmentForm] = Form.useForm<DepartmentFormValues>();
  const [reasonForm] = Form.useForm<ReasonFormValues>();
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const canManageDepartments = hasSystemConfigPermission(authUser);
  const listQuery = useMemo(
    () => buildDepartmentListQuery(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize],
  );
  const treeQuery = useMemo(
    () => buildDepartmentTreeQuery(appliedFilters),
    [appliedFilters],
  );
  const importApplyEligibility = useMemo(
    () =>
      getDepartmentImportApplyEligibility({
        file: importFile,
        result: importResult,
        mode: departmentImportApplyMode,
        submitting: importApplySubmitting,
        fingerprint: importFileFingerprint,
      }),
    [importApplySubmitting, importFile, importFileFingerprint, importResult],
  );

  const loadDepartments = useCallback(() => {
    if (!canManageDepartments || !demoUserId) {
      setDepartments(emptyLoadable);
      return;
    }

    setDepartments({ loading: true, data: null, error: null });
    void fetchDepartments(apiClient, listQuery)
      .then((data) => setDepartments({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setDepartments({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canManageDepartments, demoUserId, listQuery]);

  const loadTree = useCallback(() => {
    if (!canManageDepartments || !demoUserId) {
      setTree(emptyLoadable);
      return;
    }

    setTree({ loading: true, data: null, error: null });
    void fetchDepartmentTree(apiClient, treeQuery)
      .then((data) => setTree({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setTree({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canManageDepartments, demoUserId, treeQuery]);

  const loadDetail = useCallback(
    (departmentId: string) => {
      if (!canManageDepartments || !demoUserId) {
        setDetail(emptyLoadable);
        return;
      }

      setDetailDepartmentId(departmentId);
      setDetail({ loading: true, data: null, error: null });
      void fetchDepartmentDetail(apiClient, departmentId)
        .then((data) => setDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setDetail({ loading: false, data: null, error: normalizeError(error) }),
        );
    },
    [apiClient, canManageDepartments, demoUserId],
  );

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const refreshAll = useCallback(() => {
    loadDepartments();
    loadTree();
    if (detailDepartmentId) {
      loadDetail(detailDepartmentId);
    }
  }, [detailDepartmentId, loadDepartments, loadDetail, loadTree]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(trimDepartmentFilters(draftFilters));
  };

  const resetFilters = () => {
    const nextFilters = { includeArchived: false };
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
    setPageSize(defaultPageSize);
  };

  const closeDetail = () => {
    setDetailDepartmentId(null);
    setDetail(emptyLoadable);
  };

  const openCreate = () => {
    departmentForm.resetFields();
    setFormMode({ kind: "create" });
  };

  const openEdit = (department: DepartmentDetail) => {
    departmentForm.resetFields();
    departmentForm.setFieldsValue({
      code: department.code,
      name: department.name,
      parentId: department.parentId,
    });
    setFormMode({ kind: "edit", department });
  };

  const closeForm = () => {
    departmentForm.resetFields();
    setFormMode(null);
    setOperationError(null);
  };

  const handleFormFinish = async (values: DepartmentFormValues) => {
    if (!formMode) {
      return;
    }

    setSubmitting(true);
    setOperationError(null);

    try {
      const updatedDepartment =
        formMode.kind === "create"
          ? await createDepartmentFromForm(apiClient, values)
          : await updateDepartmentFromForm(apiClient, formMode.department.id, values);

      message.success(formMode.kind === "create" ? "部门已创建" : "部门已更新");
      closeForm();
      setDetailDepartmentId(updatedDepartment.id);
      setDetail({ loading: false, data: updatedDepartment, error: null });
      refreshAll();
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const openOperation = (request: DepartmentOperation) => {
    setOperation(request);
    setOperationResult(null);
    setOperationError(null);
    reasonForm.resetFields();
  };

  const closeOperation = () => {
    setOperation(null);
    setOperationResult(null);
    setOperationError(null);
    reasonForm.resetFields();
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImportFile(file);
    setImportResult(null);
    setImportError(file ? toValidationError(validateDepartmentImportCsvFile(file)) : null);
    setImportFileFingerprint(null);
    setImportApplyConfirmOpen(false);
    setImportApplyResult(null);
    setImportApplyError(null);
  };

  const handleImportDryRun = async () => {
    if (!importFile) {
      setImportError({
        kind: "bad-request",
        message: "请先选择一个 CSV 文件。",
      });
      return;
    }

    const validationMessage = validateDepartmentImportCsvFile(importFile);
    if (validationMessage) {
      setImportError(toValidationError(validationMessage));
      return;
    }

    setImportSubmitting(true);
    setImportResult(null);
    setImportError(null);
    setImportFileFingerprint(null);
    setImportApplyConfirmOpen(false);
    setImportApplyResult(null);
    setImportApplyError(null);

    try {
      const result = await dryRunDepartmentImport(apiClient, importFile);
      setImportResult(result);
      setImportFileFingerprint(buildDepartmentImportFileFingerprint(importFile, result));
      message.success("部门导入预检已完成。");
    } catch (error) {
      setImportError(normalizeError(error));
    } finally {
      setImportSubmitting(false);
    }
  };

  const openImportApplyConfirm = () => {
    if (!importApplyEligibility.canApply) {
      setImportApplyError(toValidationError(importApplyEligibility.reason));
      return;
    }

    setImportApplyError(null);
    setImportApplyConfirmOpen(true);
  };

  const closeImportApplyConfirm = () => {
    if (!importApplySubmitting) {
      setImportApplyConfirmOpen(false);
    }
  };

  const handleImportApply = async () => {
    if (importApplySubmitting) {
      return;
    }

    const eligibility = getDepartmentImportApplyEligibility({
      file: importFile,
      result: importResult,
      mode: departmentImportApplyMode,
      submitting: false,
      fingerprint: importFileFingerprint,
    });

    if (!eligibility.canApply || !importFile) {
      setImportApplyError(toValidationError(eligibility.reason));
      return;
    }

    setImportApplySubmitting(true);
    setImportApplyError(null);
    setImportApplyResult(null);

    try {
      const result = await applyDepartmentImport(apiClient, importFile, departmentImportApplyMode);
      setImportApplyResult(result);
      setImportApplyConfirmOpen(false);
      message.success("Department CSV apply completed.");
      refreshAll();
    } catch (error) {
      setImportApplyError(mapDepartmentImportApplyErrorToDisplay(normalizeError(error)));
    } finally {
      setImportApplySubmitting(false);
    }
  };

  const handleOperationOk = async () => {
    if (!operation) {
      return;
    }

    if (operationResult) {
      closeOperation();
      return;
    }

    setSubmitting(true);
    setOperationError(null);

    try {
      const result = await executeDepartmentOperation({
        apiClient,
        operation,
        reasonValues: reasonForm.getFieldsValue(),
      });

      if (result.kind === "disable") {
        message.success("部门已停用");
        setOperationResult(result);
        setDetail({ loading: false, data: result.department, error: null });
        setDetailDepartmentId(result.department.id);
      } else {
        message.success("部门已启用");
        setDetail({ loading: false, data: result.department, error: null });
        setDetailDepartmentId(result.department.id);
        closeOperation();
      }

      refreshAll();
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const flatDepartments = departments.data?.items ?? [];
  const treeDepartments = tree.data?.items ?? [];
  const parentOptions = useMemo(
    () => buildParentOptions(flatDepartments, formMode?.kind === "edit" ? formMode.department.id : null),
    [flatDepartments, formMode],
  );
  const parentNameById = useMemo(() => buildDepartmentNameMap(flatDepartments), [flatDepartments]);
  const hasFilters = hasActiveDepartmentFilters(appliedFilters);

  if (!canManageDepartments) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="部门维护"
          description="部门维护入口只对具备系统配置权限的管理员开放。"
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "当前账号无权访问部门维护。",
            detail: "请使用具备系统配置权限的管理员账号进入；无权限时不会请求部门维护服务。",
          }}
        >
          <span />
        </DataState>
      </Space>
    );
  }

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="部门维护"
          description="需要有效 session 上下文后才会请求部门维护 API。"
        />
        <PermissionHint description="当前没有可用的业务上下文；前端不会发起部门维护请求。" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack department-management-page">
      <SectionHeader
        title="部门维护"
        description="维护部门编码、名称、上级部门和启停状态；所有写入以后端系统配置权限校验与审计为准。"
        extra={
          <Space size={8} wrap>
            <Button onClick={refreshAll}>刷新</Button>
            <Button type="primary" onClick={openCreate}>
              创建部门
            </Button>
          </Space>
        }
      />

      <PermissionHint description="上级部门只表示组织结构；部门权限范围仍精确匹配当前部门，父部门不会自动拥有子部门权限，也不支持级联停用。" />

      <DepartmentImportDryRunPanel
        file={importFile}
        loading={importSubmitting}
        applySubmitting={importApplySubmitting}
        applyConfirmOpen={importApplyConfirmOpen}
        applyEligibility={importApplyEligibility}
        applyResult={importApplyResult}
        applyError={importApplyError}
        error={importError}
        result={importResult}
        onFileChange={handleImportFileChange}
        onRunDryRun={handleImportDryRun}
        onOpenApplyConfirm={openImportApplyConfirm}
        onCloseApplyConfirm={closeImportApplyConfirm}
        onConfirmApply={handleImportApply}
      />

      <ImportJobHistoryPanel
        apiClient={apiClient}
        title="部门导入记录"
        filters={departmentImportHistoryFilters}
      />

      <Card className="shell-card">
        <Space className="department-filter-bar" size={12} wrap>
          <Input.Search
            allowClear
            className="department-keyword"
            placeholder="按部门名称或编码搜索"
            enterButton="查询"
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            allowClear
            className="department-filter-select"
            placeholder="部门状态"
            options={statusOptions}
            value={draftFilters.status}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, status: value }))
            }
          />
          <Space size={8}>
            <Switch
              checked={Boolean(draftFilters.includeArchived)}
              onChange={(checked) =>
                setDraftFilters((current) => ({ ...current, includeArchived: checked }))
              }
            />
            <Typography.Text>包含停用</Typography.Text>
          </Space>
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as "list" | "tree")}
            options={[
              { label: "列表", value: "list" },
              { label: "树形", value: "tree" },
            ]}
          />
        </Space>
      </Card>

      {viewMode === "list" ? (
        <Card className="shell-card" title="部门列表">
          <DataState
            loading={departments.loading}
            error={departments.error}
            empty={!departments.loading && !departments.error && flatDepartments.length === 0}
            emptyText={hasFilters ? "没有匹配的部门" : "暂无部门"}
            onRetry={loadDepartments}
          >
            <Table<DepartmentSummary>
              className="department-table"
              rowKey="id"
              columns={createDepartmentColumns({
                parentNameById,
                onEdit: openEdit,
                onOperation: openOperation,
                onViewDetail: loadDetail,
              })}
              dataSource={flatDepartments}
              pagination={{
                current: departments.data?.page ?? page,
                pageSize: departments.data?.pageSize ?? pageSize,
                total: departments.data?.total ?? 0,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个部门`,
                onChange: (nextPage, nextPageSize) => {
                  setPage(nextPage);
                  setPageSize(nextPageSize);
                },
              }}
              scroll={{ x: 1060 }}
            />
          </DataState>
        </Card>
      ) : (
        <Card className="shell-card" title="部门树">
          <DataState
            loading={tree.loading}
            error={tree.error}
            empty={!tree.loading && !tree.error && treeDepartments.length === 0}
            emptyText={hasFilters ? "没有匹配的部门层级" : "暂无部门层级"}
            onRetry={loadTree}
          >
            <Tree
              blockNode
              defaultExpandAll
              treeData={toTreeData(treeDepartments)}
              onSelect={(keys) => {
                const key = keys[0];
                if (typeof key === "string") {
                  loadDetail(key);
                }
              }}
            />
          </DataState>
        </Card>
      )}

      <Drawer
        className="department-detail-drawer"
        title="部门详情"
        width={640}
        open={Boolean(detailDepartmentId)}
        onClose={closeDetail}
      >
        <DataState
          loading={detail.loading}
          error={detail.error}
          onRetry={() => {
            if (detailDepartmentId) {
              loadDetail(detailDepartmentId);
            }
          }}
        >
          {detail.data ? (
            <DepartmentDetailView
              department={detail.data}
              parentName={getParentLabel(detail.data.parentId, parentNameById)}
              onEdit={openEdit}
              onOperation={openOperation}
            />
          ) : null}
        </DataState>
      </Drawer>

      <DepartmentFormDrawer
        form={departmentForm}
        mode={formMode}
        parentOptions={parentOptions}
        submitting={submitting}
        error={operationError}
        onClose={closeForm}
        onFinish={handleFormFinish}
      />

      <DepartmentOperationModal
        operation={operation}
        result={operationResult}
        form={reasonForm}
        submitting={submitting}
        error={operationError}
        onCancel={closeOperation}
        onOk={handleOperationOk}
      />
    </Space>
  );
}

export const validateDepartmentImportCsvFile = (
  file: Pick<File, "name" | "size" | "type">,
): string | null => validateImportDryRunCsvFile(file);

export const dryRunDepartmentImport = async (
  client: Pick<AccountManagementApiClient, "dryRunDepartmentImport">,
  file: File,
): Promise<DepartmentImportDryRunResult> => client.dryRunDepartmentImport({ file });

export const applyDepartmentImport = async (
  client: Pick<AccountManagementApiClient, "applyDepartmentImport">,
  file: File,
  mode: DepartmentImportApplyMode = departmentImportApplyMode,
): Promise<DepartmentImportApplyResult> => client.applyDepartmentImport({ file, mode });

export const buildDepartmentImportFileFingerprint = (
  file: Pick<File, "name" | "size" | "lastModified">,
  result: DepartmentImportDryRunResult,
): DepartmentImportFileFingerprint => ({
  name: file.name,
  size: file.size,
  lastModified: file.lastModified,
  resultName: result.file.name,
  resultSize: result.file.size,
});

export const isSameDepartmentImportFile = (
  file: Pick<File, "name" | "size" | "lastModified"> | null,
  fingerprint: DepartmentImportFileFingerprint | null,
): boolean =>
  Boolean(
    file &&
      fingerprint &&
      file.name === fingerprint.name &&
      file.size === fingerprint.size &&
      file.lastModified === fingerprint.lastModified,
  );

export const getDepartmentImportApplyEligibility = ({
  file,
  result,
  mode,
  submitting,
  fingerprint,
}: {
  file: Pick<File, "name" | "size" | "lastModified"> | null;
  result: DepartmentImportDryRunResult | null;
  mode: string;
  submitting: boolean;
  fingerprint: DepartmentImportFileFingerprint | null;
}): DepartmentImportApplyEligibility => {
  if (submitting) {
    return { canApply: false, reason: "部门导入正在执行，请等待当前操作完成。" };
  }

  if (mode !== departmentImportApplyMode) {
    return { canApply: false, reason: "当前仅支持创建新部门。" };
  }

  if (!file) {
    return { canApply: false, reason: "请先选择一个部门 CSV 文件。" };
  }

  if (!result) {
    return { canApply: false, reason: "请先完成部门导入预检。" };
  }

  if (!isSameDepartmentImportFile(file, fingerprint)) {
    return { canApply: false, reason: "已选择的文件发生变化，请重新预检。" };
  }

  if (result.importType !== "DEPARTMENT_METADATA" || result.dryRun !== true) {
    return { canApply: false, reason: "当前结果不能用于部门导入。" };
  }

  if (result.summary.totalRows <= 0) {
    return { canApply: false, reason: "部门导入至少需要一行有效数据。" };
  }

  if (result.summary.errorRows > 0) {
    return { canApply: false, reason: "请先处理预检错误。" };
  }

  if (result.summary.warningRows > 0) {
    return { canApply: false, reason: "请先处理预检警告。" };
  }

  if (result.summary.createCandidates !== result.summary.totalRows) {
    return { canApply: false, reason: "所有行都必须是创建候选记录。" };
  }

  if (result.rows.some((row) => row.status !== "VALID")) {
    return { canApply: false, reason: "所有部门导入行都必须通过预检。" };
  }

  if (result.rows.some((row) => row.candidateAction !== "CREATE")) {
    return { canApply: false, reason: "所有部门导入行都必须是创建动作。" };
  }

  return { canApply: true, reason: "已通过预检，可以创建部门。" };
};

export const mapDepartmentImportApplyErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "部门导入需要有效登录状态",
      detail: "请重新登录并重新预检后再导入。",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "部门导入需要系统配置权限",
      detail: "请使用具备系统配置权限的管理员账号；最终权限校验仍以后端为准。",
    };
  }

  if (error.status === 400 || error.kind === "bad-request") {
    return {
      ...error,
      message: "部门导入被业务规则拒绝",
      detail: buildRejectedApplyErrorDetail(error),
    };
  }

  if (error.kind === "network" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "部门导入服务暂不可用",
      detail: "请在本地服务可用后重试；当前页面不会记录部门导入结果。",
    };
  }

  return {
    ...error,
    message: error.message || "部门导入失败",
  };
};

const buildRejectedApplyErrorDetail = (error: ApiError): string => {
  const summary = readRejectedApplySummary(error.body);
  const codes = readRejectedApplyErrorCodes(error.body);
  const parts = [
    summary
      ? `created=${summary.createdRows}; skipped=${summary.skippedRows}; failed=${summary.failedRows}; errors=${summary.errorCount}; warnings=${summary.warningCount}`
      : null,
    codes.length > 0 ? `codes=${codes.join(",")}` : null,
    error.detail,
  ].filter((part): part is string => Boolean(part));

  return parts.join("; ") || "Backend validation rejected the create-only apply request.";
};

const readRejectedApplySummary = (
  body: unknown,
): DepartmentImportApplyResult["summary"] | null => {
  if (typeof body !== "object" || body === null || !("summary" in body)) {
    return null;
  }

  const summary = (body as { summary?: unknown }).summary;
  if (typeof summary !== "object" || summary === null) {
    return null;
  }

  const candidate = summary as Partial<DepartmentImportApplyResult["summary"]>;
  return typeof candidate.createdRows === "number" &&
    typeof candidate.skippedRows === "number" &&
    typeof candidate.failedRows === "number" &&
    typeof candidate.errorCount === "number" &&
    typeof candidate.warningCount === "number"
    ? {
        totalRows: typeof candidate.totalRows === "number" ? candidate.totalRows : 0,
        createdRows: candidate.createdRows,
        skippedRows: candidate.skippedRows,
        failedRows: candidate.failedRows,
        errorCount: candidate.errorCount,
        warningCount: candidate.warningCount,
      }
    : null;
};

const readRejectedApplyErrorCodes = (body: unknown): string[] => {
  if (typeof body !== "object" || body === null || !("errors" in body)) {
    return [];
  }

  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) {
    return [];
  }

  return [
    ...new Set(
      errors
        .map((error) =>
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : null,
        )
        .filter((code): code is string => Boolean(code)),
    ),
  ];
};

export function DepartmentImportDryRunPanel({
  file,
  loading,
  applySubmitting = false,
  applyConfirmOpen = false,
  applyEligibility = { canApply: false, reason: "请先完成部门导入预检。" },
  applyResult = null,
  applyError = null,
  error,
  result,
  onFileChange,
  onRunDryRun,
  onOpenApplyConfirm = () => undefined,
  onCloseApplyConfirm = () => undefined,
  onConfirmApply = () => undefined,
}: {
  file: File | null;
  loading: boolean;
  applySubmitting?: boolean;
  applyConfirmOpen?: boolean;
  applyEligibility?: DepartmentImportApplyEligibility;
  applyResult?: DepartmentImportApplyResult | null;
  applyError?: ApiError | null;
  error: ApiError | null;
  result: DepartmentImportDryRunResult | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRunDryRun: () => void;
  onOpenApplyConfirm?: () => void;
  onCloseApplyConfirm?: () => void;
  onConfirmApply?: () => void | Promise<void>;
}) {
  return (
    <>
      <ImportDryRunPanelShell
        className="shell-card department-import-dry-run-card"
        title="部门导入预检"
        noticeMessage="上传 CSV 文件后，系统会先检查部门编码、名称和上级部门关系。"
        noticeDescription="预检通过后可创建新的部门信息，不会执行更新、合并或删除操作。"
        fileAriaLabel="部门 CSV 文件"
        file={file}
        loading={loading}
        controlsDisabled={applySubmitting}
        error={error}
        result={result}
        emptyHint="请选择一个 CSV 文件进行部门导入预检。"
        onFileChange={onFileChange}
        onRunDryRun={onRunDryRun}
        extraActions={
          <Button
            loading={applySubmitting}
            disabled={!applyEligibility.canApply || loading || applySubmitting}
            onClick={onOpenApplyConfirm}
          >
            创建部门
          </Button>
        }
        renderResult={(dryRunResult) => (
          <DepartmentImportDryRunResultView result={dryRunResult} />
        )}
        afterResult={
          <DepartmentImportApplyStatus
            eligibility={applyEligibility}
            result={applyResult}
            error={applyError}
          />
        }
      />
      <DepartmentImportApplyConfirmModal
        open={applyConfirmOpen}
        submitting={applySubmitting}
        result={result}
        onCancel={onCloseApplyConfirm}
        onConfirm={onConfirmApply}
      />
    </>
  );
}

export function DepartmentImportDryRunResultView({
  result,
}: {
  result: DepartmentImportDryRunResult;
}) {
  return (
    <ImportDryRunResultShell
      result={result}
      writeSafetyDescription="no database writes were requested."
      summaryItems={[
        {
          label: "Create candidates",
          value: result.summary.createCandidates,
        },
        {
          label: "Existing code rows",
          value: result.summary.existingCodeRows,
        },
      ]}
      tableColumns={departmentImportDryRunColumns}
      tableScrollX={1040}
    />
  );
}

function DepartmentImportApplyStatus({
  eligibility,
  result,
  error,
}: {
  eligibility: DepartmentImportApplyEligibility;
  result: DepartmentImportApplyResult | null;
  error: ApiError | null;
}) {
  return (
    <Space direction="vertical" size={8} className="full-width">
      <Alert
        type={eligibility.canApply ? "success" : "info"}
        showIcon
        message={
          eligibility.canApply
            ? "可以创建部门"
            : "暂不能创建部门"
        }
        description={eligibility.reason}
      />
      {error ? (
        <Alert
          type="error"
          showIcon
          message={error.message}
          description={error.detail}
        />
      ) : null}
      {result ? <DepartmentImportApplyResultView result={result} /> : null}
    </Space>
  );
}

function DepartmentImportApplyResultView({
  result,
}: {
  result: DepartmentImportApplyResult;
}) {
  const errorCodes = [...new Set(result.errors.map((error) => error.code))];

  return (
    <Card size="small" title="部门导入结果">
      <Space direction="vertical" size={10} className="full-width">
        <Alert
          type={result.summary.errorCount > 0 ? "warning" : "success"}
          showIcon
          message="部门导入结果"
          description="结果已脱敏展示。审计记录由后端在部门创建事务中同步写入。"
        />
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="执行模式">{result.mode}</Descriptions.Item>
          <Descriptions.Item label="已创建行">
            {result.summary.createdRows}
          </Descriptions.Item>
          <Descriptions.Item label="跳过行">
            {result.summary.skippedRows}
          </Descriptions.Item>
          <Descriptions.Item label="失败行">
            {result.summary.failedRows}
          </Descriptions.Item>
          <Descriptions.Item label="Error count">
            {result.summary.errorCount}
          </Descriptions.Item>
          <Descriptions.Item label="审计操作">
            {departmentImportApplyAuditOperation}
          </Descriptions.Item>
        </Descriptions>
        {errorCodes.length > 0 ? (
          <Space size={[6, 6]} wrap>
            <Typography.Text strong>Rejected codes</Typography.Text>
            {errorCodes.map((code) => (
              <Tag color="red" key={code}>
                {code}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">无拒绝或错误摘要。</Typography.Text>
        )}
      </Space>
    </Card>
  );
}

function DepartmentImportApplyConfirmModal({
  open,
  submitting,
  result,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  result: DepartmentImportDryRunResult | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Modal
      title="创建部门"
      open={open}
      okText="创建部门"
      cancelText="取消"
      confirmLoading={submitting}
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
      getContainer={false}
      onCancel={onCancel}
      onOk={onConfirm}
      destroyOnHidden
    >
      <DepartmentImportApplyConfirmContent result={result} />
    </Modal>
  );
}

export function DepartmentImportApplyConfirmContent({
  result,
}: {
  result: DepartmentImportDryRunResult | null;
}) {
  return (
    <Space direction="vertical" size={12} className="full-width">
      <Alert
        type="warning"
        showIcon
        message="确认创建部门信息"
        description="本次操作仅创建新部门，不会更新、合并、删除、停用、启用或重新激活部门。"
      />
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="导入方式">仅创建新部门</Descriptions.Item>
        <Descriptions.Item label="Rows requested">
          {result?.summary.createCandidates ?? 0}
        </Descriptions.Item>
        <Descriptions.Item label="审计操作">
          {departmentImportApplyAuditOperation}
        </Descriptions.Item>
      </Descriptions>
      <Typography.Text type="secondary">
        The backend re-parses and revalidates the uploaded CSV before writing. Local
        页面仅展示本次导入的安全摘要。
      </Typography.Text>
    </Space>
  );
}

const departmentImportDryRunColumns: TableProps<DepartmentImportDryRunRow>["columns"] = [
  {
    title: "Row",
    dataIndex: "rowNumber",
    key: "rowNumber",
    width: 72,
  },
  {
    title: "Parsed fields",
    key: "parsed",
    width: 260,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>code: {row.parsed.code ?? "-"}</Typography.Text>
        <Typography.Text>name: {row.parsed.name ?? "-"}</Typography.Text>
        <Typography.Text>parentCode: {row.parsed.parentCode ?? "-"}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: DepartmentImportDryRunRow["status"]) => (
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
    width: 260,
    render: (issues: DepartmentImportDryRunIssue[]) =>
      renderImportDryRunIssueList(issues, "error"),
  },
  {
    title: "Warnings",
    dataIndex: "warnings",
    key: "warnings",
    width: 260,
    render: (issues: DepartmentImportDryRunIssue[]) =>
      renderImportDryRunIssueList(issues, "warning"),
  },
];

const toValidationError = (message: string | null): ApiError | null =>
  message
    ? {
        kind: "bad-request",
        message,
      }
    : null;

export const buildDepartmentListQuery = (
  filters: DepartmentFilters,
  page: number,
  pageSize: number,
): ListDepartmentsQuery => ({
  ...trimDepartmentFilters(filters),
  page,
  pageSize,
});

export const buildDepartmentTreeQuery = (
  filters: DepartmentFilters,
): ListDepartmentsQuery => trimDepartmentFilters(filters);

export const fetchDepartments = async (
  client: Pick<AccountManagementApiClient, "listDepartments">,
  query: ListDepartmentsQuery,
): Promise<DepartmentListResponse> => {
  const result = await client.listDepartments(query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : query.page ?? 1,
    pageSize:
      typeof result.pageSize === "number" ? result.pageSize : query.pageSize ?? defaultPageSize,
  };
};

export const fetchDepartmentTree = async (
  client: Pick<AccountManagementApiClient, "getDepartmentTree">,
  query: ListDepartmentsQuery,
): Promise<DepartmentTreeResponse> => {
  const result = await client.getDepartmentTree(query);
  return {
    items: Array.isArray(result.items) ? result.items : [],
  };
};

export const fetchDepartmentDetail = async (
  client: Pick<AccountManagementApiClient, "getDepartmentDetail">,
  departmentId: string,
): Promise<DepartmentDetail> => client.getDepartmentDetail(departmentId);

export const buildCreateDepartmentPayload = (
  values: DepartmentFormValues,
): CreateDepartmentInput => {
  const code = values.code?.trim();
  const name = values.name?.trim();

  if (!code || !name) {
    throw new Error("Department code and name are required.");
  }

  return {
    code,
    name,
    parentId: normalizeParentId(values.parentId),
  };
};

export const buildUpdateDepartmentPayload = (
  values: DepartmentFormValues,
): UpdateDepartmentInput => {
  const code = values.code?.trim();
  const name = values.name?.trim();
  const payload: UpdateDepartmentInput = {};

  if (code) {
    payload.code = code;
  }

  if (name) {
    payload.name = name;
  }

  if ("parentId" in values) {
    payload.parentId = normalizeParentId(values.parentId);
  }

  if (payload.code === undefined && payload.name === undefined && !("parentId" in payload)) {
    throw new Error("At least one department update field is required.");
  }

  return payload;
};

export const buildDepartmentReasonPayload = (
  values: ReasonFormValues,
): DepartmentReasonInput => {
  const reason = values.reason?.trim();
  return reason ? { reason } : {};
};

export const createDepartmentFromForm = async (
  client: Pick<AccountManagementApiClient, "createDepartment">,
  values: DepartmentFormValues,
): Promise<DepartmentDetail> => client.createDepartment(buildCreateDepartmentPayload(values));

export const updateDepartmentFromForm = async (
  client: Pick<AccountManagementApiClient, "updateDepartment">,
  departmentId: string,
  values: DepartmentFormValues,
): Promise<DepartmentDetail> =>
  client.updateDepartment(departmentId, buildUpdateDepartmentPayload(values));

export const executeDepartmentOperation = async ({
  apiClient,
  operation,
  reasonValues = {},
}: {
  apiClient: Pick<AccountManagementApiClient, "disableDepartment" | "enableDepartment">;
  operation: DepartmentOperation;
  reasonValues?: ReasonFormValues;
}): Promise<
  | { kind: "disable"; department: DepartmentDetail; impactSummary: DepartmentImpactSummary }
  | { kind: "enable"; department: DepartmentDetail }
> => {
  if (operation.kind === "disable") {
    const response = await apiClient.disableDepartment(
      operation.department.id,
      buildDepartmentReasonPayload(reasonValues),
    );

    return {
      kind: "disable",
      department: response.department,
      impactSummary: response.impactSummary,
    };
  }

  return {
    kind: "enable",
    department: await apiClient.enableDepartment(
      operation.department.id,
      buildDepartmentReasonPayload(reasonValues),
    ),
  };
};

const trimDepartmentFilters = (filters: DepartmentFilters): DepartmentFilters => {
  const keyword = filters.keyword?.trim();

  return {
    keyword: keyword || undefined,
    status: filters.status,
    includeArchived: Boolean(filters.includeArchived) || undefined,
  };
};

const hasActiveDepartmentFilters = (filters: DepartmentFilters): boolean =>
  Boolean(filters.keyword?.trim() || filters.status || filters.includeArchived);

const normalizeParentId = (parentId: string | null | undefined): string | null => {
  const trimmed = parentId?.trim();
  return trimmed || null;
};

const buildParentOptions = (
  departments: DepartmentSummary[],
  excludedDepartmentId: string | null,
) =>
  departments
    .filter((department) => department.status === "ACTIVE" && department.id !== excludedDepartmentId)
    .map((department) => ({
      value: department.id,
      label: `${department.name} / ${department.code}`,
    }));

const buildDepartmentNameMap = (departments: DepartmentSummary[]): Record<string, string> =>
  Object.fromEntries(
    departments.map((department) => [department.id, `${department.name} / ${department.code}`]),
  );

const createDepartmentColumns = ({
  parentNameById,
  onEdit,
  onOperation,
  onViewDetail,
}: {
  parentNameById: Record<string, string>;
  onEdit: (department: DepartmentDetail) => void;
  onOperation: (request: DepartmentOperation) => void;
  onViewDetail: (departmentId: string) => void;
}): TableProps<DepartmentSummary>["columns"] => [
  {
    title: "部门",
    key: "department",
    width: 260,
    render: (_, department) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{department.name}</Typography.Text>
        <Typography.Text type="secondary">{department.code}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 112,
    render: (status: DepartmentStatus) => renderDepartmentStatusTag(status),
  },
  {
    title: "父部门",
    dataIndex: "parentId",
    key: "parentId",
    width: 260,
    render: (parentId: string | null) => getParentLabel(parentId, parentNameById),
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
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
    fixed: "right",
    width: 260,
    render: (_, department) => (
      <Space size={8} wrap>
        <Button size="small" onClick={() => onViewDetail(department.id)}>
          查看
        </Button>
        <Button size="small" onClick={() => onEdit(department)}>
          编辑
        </Button>
        {department.status === "ACTIVE" ? (
          <Button
            danger
            size="small"
            onClick={() => onOperation({ kind: "disable", department })}
          >
            停用
          </Button>
        ) : (
          <Button size="small" onClick={() => onOperation({ kind: "enable", department })}>
            启用
          </Button>
        )}
      </Space>
    ),
  },
];

function DepartmentDetailView({
  department,
  parentName,
  onEdit,
  onOperation,
}: {
  department: DepartmentDetail;
  parentName: string;
  onEdit: (department: DepartmentDetail) => void;
  onOperation: (request: DepartmentOperation) => void;
}) {
  return (
    <Space direction="vertical" size={16} className="full-width">
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="部门 ID">{department.id}</Descriptions.Item>
        <Descriptions.Item label="编码">{department.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{department.name}</Descriptions.Item>
        <Descriptions.Item label="父部门">{parentName}</Descriptions.Item>
        <Descriptions.Item label="状态">{renderDepartmentStatusTag(department.status)}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDateTime(department.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{formatDateTime(department.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label="停用时间">{formatDateTime(department.archivedAt)}</Descriptions.Item>
      </Descriptions>

      <Alert
        type="info"
        showIcon
        message="层级边界"
        description="上级部门只表示组织结构；权限范围精确匹配当前部门，不从父部门继承到子部门。"
      />

      <Card className="shell-card" title="部门操作">
        <Space size={8} wrap>
          <Button onClick={() => onEdit(department)}>编辑部门</Button>
          {department.status === "ACTIVE" ? (
            <Button danger onClick={() => onOperation({ kind: "disable", department })}>
              停用部门
            </Button>
          ) : (
            <Button onClick={() => onOperation({ kind: "enable", department })}>
              启用部门
            </Button>
          )}
        </Space>
      </Card>
    </Space>
  );
}

function DepartmentFormDrawer({
  form,
  mode,
  parentOptions,
  submitting,
  error,
  onClose,
  onFinish,
}: {
  form: FormInstance<DepartmentFormValues>;
  mode: DepartmentFormMode | null;
  parentOptions: Array<{ value: string; label: string }>;
  submitting: boolean;
  error: ApiError | null;
  onClose: () => void;
  onFinish: (values: DepartmentFormValues) => void | Promise<void>;
}) {
  const title = mode?.kind === "edit" ? "编辑部门" : "创建部门";

  return (
    <Drawer
      className="department-form-drawer"
      title={title}
      width={560}
      open={Boolean(mode)}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            保存
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <Alert
          type="info"
          showIcon
          message="父部门只用于组织层级"
          description="只允许选择启用中的父部门；不能选择自身；不会扩大权限 scope。"
        />
        <Form<DepartmentFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
        >
          <Form.Item
            label="部门编码"
            name="code"
            rules={[
              { required: true, message: "请输入部门编码。" },
              {
                pattern: /^[A-Z0-9_]+$/,
                message: "部门编码仅支持大写字母、数字和下划线。",
              },
            ]}
          >
            <Input autoComplete="off" placeholder="例如 RESEARCH_CENTER" />
          </Form.Item>
          <Form.Item
            label="部门名称"
            name="name"
            rules={[{ required: true, message: "请输入部门名称。" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item label="父部门" name="parentId">
            <Select
              allowClear
              showSearch
              placeholder="无父部门"
              optionFilterProp="label"
              options={parentOptions}
            />
          </Form.Item>
        </Form>
      </Space>
    </Drawer>
  );
}

function DepartmentOperationModal({
  operation,
  result,
  form,
  submitting,
  error,
  onCancel,
  onOk,
}: {
  operation: DepartmentOperation | null;
  result: DepartmentOperationResult | null;
  form: FormInstance<ReasonFormValues>;
  submitting: boolean;
  error: ApiError | null;
  onCancel: () => void;
  onOk: () => void | Promise<void>;
}) {
  const isDisable = operation?.kind === "disable";

  return (
    <Modal
      title={operation ? getOperationTitle(operation) : ""}
      open={Boolean(operation)}
      okText={result ? "完成" : "确认"}
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onOk}
      destroyOnHidden
    >
      <Space direction="vertical" size={12} className="full-width">
        {isDisable ? (
          <Alert
            type="warning"
            showIcon
            message="停用部门不会删除历史成果、审批、费用、审计。"
            description="停用后不提供新用户绑定、新成果创建或新审批分派入口；本页面不提供级联停用。"
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="启用部门只恢复部门状态，不自动迁移用户、角色 scope 或历史数据。"
          />
        )}
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        {result?.kind === "disable" ? (
          <Alert type="success" showIcon message="后端已返回停用影响摘要。" />
        ) : null}
        {isDisable ? <ImpactSummaryView summary={result?.kind === "disable" ? result.impactSummary : null} /> : null}
        <ReasonForm form={form} disabled={Boolean(result)} />
      </Space>
    </Modal>
  );
}

function ReasonForm({
  form,
  disabled,
}: {
  form: FormInstance<ReasonFormValues>;
  disabled?: boolean;
}) {
  return (
    <Form<ReasonFormValues> form={form} layout="vertical" requiredMark={false}>
      <Form.Item label="原因（可选）" name="reason">
        <Input.TextArea disabled={disabled} maxLength={300} rows={3} />
      </Form.Item>
    </Form>
  );
}

function ImpactSummaryView({ summary }: { summary: DepartmentImpactSummary | null }) {
  return (
    <Card className="shell-card" size="small" title="停用影响摘要">
      <div className="department-impact-grid">
        {impactSummaryLabels.map((item) => (
          <div className="department-impact-item" key={item.key}>
            <Typography.Text type="secondary">{item.label}</Typography.Text>
            <Typography.Text strong>
              {summary ? summary[item.key] : "等待后端检查"}
            </Typography.Text>
            {item.blocked ? <Tag color="orange">可能阻塞</Tag> : <Tag>历史保留</Tag>}
          </div>
        ))}
      </div>
    </Card>
  );
}

const getOperationTitle = (operation: DepartmentOperation): string =>
  operation.kind === "disable"
    ? `停用部门：${operation.department.name}`
    : `启用部门：${operation.department.name}`;

const renderDepartmentStatusTag = (status: DepartmentStatus) => (
  <Tag color={status === "ACTIVE" ? "green" : "default"}>{statusLabels[status] ?? status}</Tag>
);

const getParentLabel = (parentId: string | null, parentNameById: Record<string, string>): string =>
  parentId ? parentNameById[parentId] ?? parentId : "无父部门";

const toTreeData = (nodes: DepartmentTreeNode[]): DepartmentTreeDataNode[] =>
  nodes.map((node) => ({
    key: node.id,
    title: (
      <Space size={8} wrap>
        <Typography.Text>{node.name}</Typography.Text>
        <Typography.Text type="secondary">{node.code}</Typography.Text>
        {renderDepartmentStatusTag(node.status)}
      </Space>
    ),
    children: toTreeData(node.children ?? []),
  }));

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
