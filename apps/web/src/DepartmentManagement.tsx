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
  };

  const handleImportDryRun = async () => {
    if (!importFile) {
      setImportError({
        kind: "bad-request",
        message: "Select a CSV file before running dry-run.",
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

    try {
      const result = await dryRunDepartmentImport(apiClient, importFile);
      setImportResult(result);
      message.success("Department CSV dry-run completed.");
    } catch (error) {
      setImportError(normalizeError(error));
    } finally {
      setImportSubmitting(false);
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
          description="部门维护入口只对具备 system:config 权限的管理员开放。"
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "当前账号无权访问部门维护。",
            detail: "请使用具备 system:config 权限的管理员账号进入；无权限时不会请求 /departments。",
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
        description="维护部门 code、name、parentId 和启停状态；所有写入以后端 system:config 校验与审计为准。"
        extra={
          <Space size={8} wrap>
            <Button onClick={refreshAll}>刷新</Button>
            <Button type="primary" onClick={openCreate}>
              创建部门
            </Button>
          </Space>
        }
      />

      <PermissionHint description="parentId 只表示组织结构；部门权限 scope 仍是精确 departmentId，父部门不会自动拥有子部门权限，也不支持级联停用。" />

      <DepartmentImportDryRunPanel
        file={importFile}
        loading={importSubmitting}
        error={importError}
        result={importResult}
        onFileChange={handleImportFileChange}
        onRunDryRun={handleImportDryRun}
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
        <Card className="shell-card" title="部门列表" extra={<Tag>GET /departments</Tag>}>
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
        <Card className="shell-card" title="部门树" extra={<Tag>GET /departments/tree</Tag>}>
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

export function DepartmentImportDryRunPanel({
  file,
  loading,
  error,
  result,
  onFileChange,
  onRunDryRun,
}: {
  file: File | null;
  loading: boolean;
  error: ApiError | null;
  result: DepartmentImportDryRunResult | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRunDryRun: () => void;
}) {
  return (
    <ImportDryRunPanelShell
      className="shell-card department-import-dry-run-card"
      title="Department CSV dry-run"
      endpoint="POST /imports/departments/dry-run"
      noticeMessage="dryRun=true; CSV-only; validates structure and data without writing the database."
      noticeDescription="Accepted headers are code and name, with optional parentCode. This screen has no real import execution control."
      fileAriaLabel="Department CSV file"
      file={file}
      loading={loading}
      error={error}
      result={result}
      emptyHint="Select one .csv file to preview validation results."
      onFileChange={onFileChange}
      onRunDryRun={onRunDryRun}
      renderResult={(dryRunResult) => (
        <DepartmentImportDryRunResultView result={dryRunResult} />
      )}
    />
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
    title: "Status",
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
        description="parentId 只表示组织结构；权限 scope 精确匹配当前 departmentId，不从父部门继承到子部门。"
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
