import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type FormInstance,
} from "antd";
import type { SelectProps, TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  createApiClient,
  isApiError,
  type AccountManagementApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
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
  AccountLifecycleDeliverySummary,
  AccountRoleCode,
  AccountRoleScopeType,
  AccountUserDetail,
  AccountUserListResponse,
  AccountUserStatus,
  AccountUserSummary,
  AssignAccountUserRoleInput,
  ChangeAccountUserDepartmentInput,
  CreateAccountUserInput,
  CreateInviteInput,
  DepartmentListResponse,
  DepartmentSummary,
  DisableAccountUserInput,
  EnableAccountUserInput,
  InviteIssueResponse,
  ListAccountUsersQuery,
  RevokeAccountUserRoleInput,
  UserAccountImportApplyMode,
  UserAccountImportApplyResult,
  UserAccountImportDryRunIssue,
  UserAccountImportDryRunResult,
  UserAccountImportDryRunRow,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type AccountUserFilters = {
  keyword?: string;
  status?: AccountUserStatus;
  departmentId?: string;
  roleCode?: AccountRoleCode;
};

type CreateUserFormValues = {
  email: string;
  name: string;
  departmentId: string;
  roles: Array<{
    roleCode?: AccountRoleCode;
    scopeType?: AccountRoleScopeType;
    departmentId?: string;
  }>;
  initialPassword?: string;
};

type CreateInviteFormValues = Omit<CreateUserFormValues, "initialPassword"> & {
  reason?: string;
};

type ReasonFormValues = {
  reason?: string;
};

type AssignRoleFormValues = {
  roleCode?: AccountRoleCode;
  scopeType?: AccountRoleScopeType;
  departmentId?: string;
  reason?: string;
};

type ChangeDepartmentFormValues = {
  departmentId?: string;
  reason?: string;
};

type DepartmentOption = {
  value: string;
  label: string;
};

type DepartmentSelectorState = {
  options: DepartmentOption[];
  loading: boolean;
  error: ApiError | null;
};

type OperationRequest =
  | { kind: "disable"; user: AccountUserDetail }
  | { kind: "enable"; user: AccountUserDetail }
  | { kind: "resend-invite"; user: AccountUserDetail }
  | { kind: "admin-password-reset"; user: AccountUserDetail }
  | { kind: "revoke-password-reset"; user: AccountUserDetail }
  | { kind: "assign-role"; user: AccountUserDetail }
  | { kind: "revoke-role"; user: AccountUserDetail; userRole: AccountUserDetail["roles"][number] }
  | { kind: "change-department"; user: AccountUserDetail };

type AccountManagementProps = {
  demoUserId: string | null;
  authUser: Pick<AuthUser, "permissionCodes"> | null;
};

type UserAccountImportApplyEligibility = {
  canApply: boolean;
  reason: string;
};

type UserAccountImportFileFingerprint = {
  name: string;
  size: number;
  lastModified: number;
  resultName: string;
  resultSize: number;
};

const defaultPageSize = 20;
const userAccountImportApplyMode: UserAccountImportApplyMode =
  "CREATE_ONLY_PENDING_NO_CREDENTIAL";
const userAccountImportApplyAuditOperation =
  "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL";
export const userAccountImportHistoryFilters: ImportJobHistoryFilters = {
  family: "USER_ACCOUNT",
  mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

export const accountManagementPermissionCode = "system:config";
export const accountInvitePermissionCode = "account:invite";
export const accountResetPasswordPermissionCode = "account:reset_password";

const statusOptions: Array<{ label: string; value: AccountUserStatus }> = [
  { label: "启用", value: "ACTIVE" },
  { label: "Pending activation", value: "PENDING_ACTIVATION" },
  { label: "禁用", value: "DISABLED" },
  { label: "归档", value: "ARCHIVED" },
];

const roleOptions: Array<{ label: string; value: AccountRoleCode }> = [
  { label: "科研人员", value: "RESEARCHER" },
  { label: "科研秘书", value: "RESEARCH_SECRETARY" },
  { label: "部门管理员", value: "DEPARTMENT_ADMIN" },
  { label: "系统管理员", value: "SYSTEM_ADMIN" },
  { label: "Finance Reviewer", value: "FINANCE_REVIEWER" },
  { label: "审计员", value: "AUDITOR" },
  { label: "负责人", value: "LEADER" },
  { label: "保密员", value: "SECRET_MANAGER" },
];

const scopeTypeOptions: Array<{ label: string; value: AccountRoleScopeType }> = [
  { label: "全局", value: "GLOBAL" },
  { label: "部门", value: "DEPARTMENT" },
];

const statusLabels = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
) as Record<AccountUserStatus, string>;

const roleLabels = Object.fromEntries(
  roleOptions.map((option) => [option.value, option.label]),
) as Record<AccountRoleCode, string>;

const credentialStatusLabels: Record<string, string> = {
  ACTIVE: "可登录",
  DISABLED: "凭证禁用",
};

export function AccountManagement({ demoUserId, authUser }: AccountManagementProps) {
  const [draftFilters, setDraftFilters] = useState<AccountUserFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AccountUserFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [users, setUsers] = useState<Loadable<AccountUserListResponse>>(emptyLoadable);
  const [departments, setDepartments] = useState<Loadable<DepartmentSummary[]>>(emptyLoadable);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<ApiError | null>(null);
  const [importResult, setImportResult] = useState<UserAccountImportDryRunResult | null>(null);
  const [importApplySubmitting, setImportApplySubmitting] = useState(false);
  const [importApplyConfirmOpen, setImportApplyConfirmOpen] = useState(false);
  const [importApplyResult, setImportApplyResult] =
    useState<UserAccountImportApplyResult | null>(null);
  const [importApplyError, setImportApplyError] = useState<ApiError | null>(null);
  const [importFileFingerprint, setImportFileFingerprint] =
    useState<UserAccountImportFileFingerprint | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Loadable<AccountUserDetail>>(emptyLoadable);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [operation, setOperation] = useState<OperationRequest | null>(null);
  const [operationError, setOperationError] = useState<ApiError | null>(null);
  const [operationSubmitting, setOperationSubmitting] = useState(false);
  const [createForm] = Form.useForm<CreateUserFormValues>();
  const [inviteForm] = Form.useForm<CreateInviteFormValues>();
  const [reasonForm] = Form.useForm<ReasonFormValues>();
  const [assignRoleForm] = Form.useForm<AssignRoleFormValues>();
  const [departmentForm] = Form.useForm<ChangeDepartmentFormValues>();
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const canReadAccounts = hasSystemConfigPermission(authUser);
  const canInviteAccounts = hasAccountInvitePermission(authUser);
  const canResetPasswords = hasAccountResetPasswordPermission(authUser);
  const query = useMemo(
    () => buildAccountUserListQuery(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize],
  );
  const departmentOptions = useMemo(
    () => buildActiveDepartmentOptions(departments.data ?? []),
    [departments.data],
  );
  const departmentSelector = useMemo(
    () => ({
      options: departmentOptions,
      loading: departments.loading,
      error: departments.error,
    }),
    [departmentOptions, departments.error, departments.loading],
  );
  const importApplyEligibility = useMemo(
    () =>
      getUserAccountImportApplyEligibility({
        file: importFile,
        result: importResult,
        mode: userAccountImportApplyMode,
        submitting: importApplySubmitting,
        fingerprint: importFileFingerprint,
      }),
    [importApplySubmitting, importFile, importFileFingerprint, importResult],
  );

  const loadUsers = useCallback(() => {
    if (!canReadAccounts || !demoUserId) {
      setUsers(emptyLoadable);
      return;
    }

    setUsers({ loading: true, data: null, error: null });
    void fetchAccountUsers(apiClient, query)
      .then((data) => setUsers({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setUsers({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canReadAccounts, demoUserId, query]);

  const loadDepartments = useCallback(() => {
    if (!shouldLoadAccountDepartmentOptions(canReadAccounts, demoUserId)) {
      setDepartments(emptyLoadable);
      return;
    }

    setDepartments({ loading: true, data: null, error: null });
    void fetchActiveDepartments(apiClient)
      .then((items) => setDepartments({ loading: false, data: items, error: null }))
      .catch((error: unknown) =>
        setDepartments({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canReadAccounts, demoUserId]);

  const loadDetail = useCallback(
    (userId: string) => {
      if (!canReadAccounts || !demoUserId) {
        setDetail(emptyLoadable);
        return;
      }

      setDetailUserId(userId);
      setDetail({ loading: true, data: null, error: null });
      void fetchAccountUserDetail(apiClient, userId)
        .then((data) => setDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setDetail({ loading: false, data: null, error: normalizeError(error) }),
        );
    },
    [apiClient, canReadAccounts, demoUserId],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(trimAccountUserFilters(draftFilters));
  };

  const resetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
    setPage(1);
    setPageSize(defaultPageSize);
  };

  const closeDetail = () => {
    setDetailUserId(null);
    setDetail(emptyLoadable);
  };

  const openCreateUser = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      roles: [{ roleCode: "RESEARCHER", scopeType: "DEPARTMENT" }],
    });
    setCreateOpen(true);
  };

  const closeCreateUser = () => {
    createForm.resetFields();
    setCreateOpen(false);
  };

  const openCreateInvite = () => {
    inviteForm.resetFields();
    inviteForm.setFieldsValue({
      roles: [{ roleCode: "RESEARCHER", scopeType: "DEPARTMENT" }],
    });
    setInviteOpen(true);
  };

  const closeCreateInvite = () => {
    inviteForm.resetFields();
    setInviteOpen(false);
  };

  const handleCreateUser = async (values: CreateUserFormValues) => {
    setOperationSubmitting(true);
    setOperationError(null);

    try {
      const user = await createAccountUserFromForm(apiClient, values);
      message.success("用户已创建");
      closeCreateUser();
      loadUsers();
      loadDetail(user.id);
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      createForm.setFieldValue("initialPassword", undefined);
      setOperationSubmitting(false);
    }
  };

  const handleCreateInvite = async (values: CreateInviteFormValues) => {
    setOperationSubmitting(true);
    setOperationError(null);

    try {
      const issue = await createInviteFromForm(apiClient, values);
      message.success(`Invite queued: ${issue.deliveryStatus}`);
      closeCreateInvite();
      loadUsers();
      loadDetail(issue.userId);
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      setOperationSubmitting(false);
    }
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    setImportResult(null);
    setImportApplyResult(null);
    setImportApplyError(null);
    setImportApplyConfirmOpen(false);
    setImportFileFingerprint(null);
    setImportFile(nextFile);
    setImportError(nextFile ? toValidationError(validateUserAccountImportCsvFile(nextFile)) : null);
  };

  const handleUserImportDryRun = async () => {
    if (!importFile) {
      setImportError(toValidationError("Select one .csv file before running dry-run."));
      return;
    }

    const validationError = validateUserAccountImportCsvFile(importFile);
    if (validationError) {
      setImportError(toValidationError(validationError));
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    setImportApplyResult(null);
    setImportApplyError(null);
    setImportFileFingerprint(null);

    try {
      const result = await dryRunUserAccountImport(apiClient, importFile);
      setImportResult(result);
      setImportFileFingerprint(buildUserAccountImportFileFingerprint(importFile, result));
      message.success("User account CSV dry-run completed.");
    } catch (error) {
      setImportError(normalizeError(error));
    } finally {
      setImportLoading(false);
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

  const handleUserImportApply = async () => {
    if (importApplySubmitting) {
      return;
    }

    const eligibility = getUserAccountImportApplyEligibility({
      file: importFile,
      result: importResult,
      mode: userAccountImportApplyMode,
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
      const result = await applyUserAccountImport(
        apiClient,
        importFile,
        userAccountImportApplyMode,
      );
      setImportApplyResult(result);
      setImportApplyConfirmOpen(false);
      message.success("User account CSV apply completed.");
      loadUsers();
    } catch (error) {
      setImportApplyError(mapUserAccountImportApplyErrorToDisplay(normalizeError(error)));
    } finally {
      setImportApplySubmitting(false);
    }
  };

  const openOperation = (request: OperationRequest) => {
    setOperation(request);
    setOperationError(null);
    reasonForm.resetFields();
    assignRoleForm.resetFields();
    departmentForm.resetFields();

    if (request.kind === "assign-role") {
      assignRoleForm.setFieldsValue({
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
      });
    }

    if (request.kind === "change-department") {
      departmentForm.setFieldsValue({
        departmentId: request.user.department.id,
      });
    }
  };

  const closeOperation = () => {
    setOperation(null);
    setOperationError(null);
    reasonForm.resetFields();
    assignRoleForm.resetFields();
    departmentForm.resetFields();
  };

  const handleOperationOk = async () => {
    if (!operation) {
      return;
    }

    setOperationSubmitting(true);
    setOperationError(null);

    try {
      const updatedUser = await executeAccountOperation({
        apiClient,
        operation,
        reasonValues: reasonForm.getFieldsValue(),
        assignRoleValues:
          operation.kind === "assign-role" ? await assignRoleForm.validateFields() : undefined,
        departmentValues:
          operation.kind === "change-department" ? await departmentForm.validateFields() : undefined,
      });

      message.success(getOperationSuccessMessage(operation.kind));
      setDetailUserId(updatedUser.id);
      setDetail({ loading: false, data: updatedUser, error: null });
      loadUsers();
      closeOperation();
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      setOperationSubmitting(false);
    }
  };

  const hasFilters = hasActiveAccountUserFilters(appliedFilters);
  const items = users.data?.items ?? [];

  if (!canReadAccounts) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="账号管理"
          description="账号管理入口只对具备 system:config 权限的管理员开放。"
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "当前账号无权访问账号管理。",
            detail: "请使用具备 system:config 权限的 production 管理员账号进入。",
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
          title="账号管理"
          description="需要有效 session 上下文后才会请求账号管理 API。"
        />
        <PermissionHint description="当前没有可用的业务上下文；前端不会发起账号管理请求。" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="账号管理"
        description="管理本地账号创建、状态、角色和部门绑定；所有操作以后端 system:config 权限校验为准。"
        extra={
          <Button type="primary" onClick={openCreateUser}>
            创建用户
          </Button>
        }
      />
      <PermissionHint description="账号管理权限最终以后端 system:config 校验为准；前端只做入口收敛和只读展示，不展示或缓存任何密码、token、session hash 或 credential secret。" />
      <PermissionHint description="部门选择器只用于账号绑定和角色部门 scope 绑定，不提供部门创建或编辑；部门 scope 仍精确匹配所选 departmentId，父部门不包含子部门权限。" />
      {departments.error ? (
        <Alert
          type="warning"
          showIcon
          message="部门选项加载失败"
          description={getDepartmentSelectorErrorDescription(departments.error)}
        />
      ) : null}

      <UserAccountImportDryRunPanel
        file={importFile}
        loading={importLoading}
        applySubmitting={importApplySubmitting}
        applyConfirmOpen={importApplyConfirmOpen}
        applyEligibility={importApplyEligibility}
        applyResult={importApplyResult}
        applyError={importApplyError}
        error={importError}
        result={importResult}
        onFileChange={handleImportFileChange}
        onRunDryRun={handleUserImportDryRun}
        onOpenApplyConfirm={openImportApplyConfirm}
        onCloseApplyConfirm={closeImportApplyConfirm}
        onConfirmApply={handleUserImportApply}
      />

      <ImportJobHistoryPanel
        apiClient={apiClient}
        title="User account import history"
        filters={userAccountImportHistoryFilters}
      />

      <Card className="shell-card" title="Account lifecycle">
        <Space size={12} wrap>
          {canInviteAccounts ? (
            <Button type="primary" onClick={openCreateInvite}>
              Invite user
            </Button>
          ) : (
            <Tag>account:invite unavailable</Tag>
          )}
          {canResetPasswords ? (
            <Tag color="blue">account:reset_password enabled</Tag>
          ) : (
            <Tag>account:reset_password unavailable</Tag>
          )}
          <Typography.Text type="secondary">
            Local demo lifecycle only: simulated delivery status is shown, but links, raw tokens,
            token hashes, passwords, and sessions are never displayed.
          </Typography.Text>
        </Space>
      </Card>

      <Card className="shell-card">
        <Space className="account-filter-bar" size={12} wrap>
          <Input.Search
            allowClear
            className="account-keyword"
            placeholder="按姓名或邮箱搜索"
            enterButton="查询"
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            allowClear
            className="account-filter-select"
            placeholder="账号状态"
            options={statusOptions}
            value={draftFilters.status}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, status: value }))
            }
          />
          <Input
            allowClear
            className="account-filter-input"
            placeholder="部门 ID"
            value={draftFilters.departmentId}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, departmentId: event.target.value }))
            }
          />
          <Select
            allowClear
            className="account-filter-select"
            placeholder="角色"
            options={roleOptions}
            value={draftFilters.roleCode}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, roleCode: value }))
            }
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadUsers}>刷新</Button>
        </Space>
      </Card>

      <Card className="shell-card" title="用户列表" extra={<Tag>GET /account-management/users</Tag>}>
        <DataState
          loading={users.loading}
          error={users.error}
          empty={!users.loading && !users.error && items.length === 0}
          emptyText={hasFilters ? "没有匹配的用户" : "暂无用户"}
          onRetry={loadUsers}
        >
          <Table<AccountUserSummary>
            className="account-user-table"
            rowKey="id"
            columns={createAccountUserColumns(loadDetail, openOperation)}
            dataSource={items}
            pagination={{
              current: users.data?.page ?? page,
              pageSize: users.data?.pageSize ?? pageSize,
              total: users.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 位用户`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            scroll={{ x: 1080 }}
          />
        </DataState>
      </Card>

      <Drawer
        className="account-detail-drawer"
        title="用户详情"
        width={640}
        open={Boolean(detailUserId)}
        onClose={closeDetail}
      >
        <DataState loading={detail.loading} error={detail.error} onRetry={() => {
          if (detailUserId) {
            loadDetail(detailUserId);
          }
        }}>
          {detail.data ? (
            <AccountUserDetailView
              user={detail.data}
              permissions={{
                canInvite: canInviteAccounts,
                canResetPassword: canResetPasswords,
              }}
              onOperation={openOperation}
            />
          ) : null}
        </DataState>
      </Drawer>

      <CreateUserDrawer
        form={createForm}
        departmentSelector={departmentSelector}
        open={createOpen}
        submitting={operationSubmitting}
        error={operationError}
        onClose={closeCreateUser}
        onFinish={handleCreateUser}
      />

      <CreateInviteDrawer
        form={inviteForm}
        departmentSelector={departmentSelector}
        open={inviteOpen}
        submitting={operationSubmitting}
        error={operationError}
        onClose={closeCreateInvite}
        onFinish={handleCreateInvite}
      />

      <AccountOperationModal
        operation={operation}
        reasonForm={reasonForm}
        assignRoleForm={assignRoleForm}
        departmentForm={departmentForm}
        departmentSelector={departmentSelector}
        submitting={operationSubmitting}
        error={operationError}
        onCancel={closeOperation}
        onOk={handleOperationOk}
      />
    </Space>
  );
}

export const hasSystemConfigPermission = (
  user: Pick<AuthUser, "permissionCodes"> | null | undefined,
): boolean => Boolean(user?.permissionCodes.includes(accountManagementPermissionCode));

export const hasAccountInvitePermission = (
  user: Pick<AuthUser, "permissionCodes"> | null | undefined,
): boolean => Boolean(user?.permissionCodes.includes(accountInvitePermissionCode));

export const hasAccountResetPasswordPermission = (
  user: Pick<AuthUser, "permissionCodes"> | null | undefined,
): boolean => Boolean(user?.permissionCodes.includes(accountResetPasswordPermissionCode));

export const buildAccountUserListQuery = (
  filters: AccountUserFilters,
  page: number,
  pageSize: number,
): ListAccountUsersQuery => ({
  ...trimAccountUserFilters(filters),
  page,
  pageSize,
});

export const fetchAccountUsers = async (
  client: Pick<AccountManagementApiClient, "listAccountUsers">,
  query: ListAccountUsersQuery,
): Promise<AccountUserListResponse> => {
  const result = await client.listAccountUsers(query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : query.page ?? 1,
    pageSize: typeof result.pageSize === "number" ? result.pageSize : query.pageSize ?? defaultPageSize,
  };
};

export const fetchAccountUserDetail = async (
  client: Pick<AccountManagementApiClient, "getAccountUser">,
  userId: string,
): Promise<AccountUserDetail> => client.getAccountUser(userId);

export const shouldLoadAccountDepartmentOptions = (
  canReadAccounts: boolean,
  demoUserId: string | null,
): boolean => Boolean(canReadAccounts && demoUserId?.trim());

export const fetchActiveDepartments = async (
  client: Pick<AccountManagementApiClient, "listDepartments">,
): Promise<DepartmentSummary[]> => {
  const response: DepartmentListResponse = await client.listDepartments({
    status: "ACTIVE",
    page: 1,
    pageSize: 100,
  });

  return (Array.isArray(response.items) ? response.items : []).filter(
    (department) => department.status === "ACTIVE",
  );
};

export const validateUserAccountImportCsvFile = (
  file: Pick<File, "name" | "size" | "type">,
): string | null => validateImportDryRunCsvFile(file);

export const dryRunUserAccountImport = async (
  client: Pick<AccountManagementApiClient, "dryRunUserAccountImport">,
  file: File,
): Promise<UserAccountImportDryRunResult> => client.dryRunUserAccountImport({ file });

export const applyUserAccountImport = async (
  client: Pick<AccountManagementApiClient, "applyUserAccountImport">,
  file: File,
  mode: UserAccountImportApplyMode = userAccountImportApplyMode,
): Promise<UserAccountImportApplyResult> => client.applyUserAccountImport({ file, mode });

export const buildUserAccountImportFileFingerprint = (
  file: Pick<File, "name" | "size" | "lastModified">,
  result: UserAccountImportDryRunResult,
): UserAccountImportFileFingerprint => ({
  name: file.name,
  size: file.size,
  lastModified: file.lastModified,
  resultName: result.file.name,
  resultSize: result.file.size,
});

export const isSameUserAccountImportFile = (
  file: Pick<File, "name" | "size" | "lastModified"> | null,
  fingerprint: UserAccountImportFileFingerprint | null,
): boolean =>
  Boolean(
    file &&
      fingerprint &&
      file.name === fingerprint.name &&
      file.size === fingerprint.size &&
      file.lastModified === fingerprint.lastModified,
  );

export const getUserAccountImportApplyEligibility = ({
  file,
  result,
  mode,
  submitting,
  fingerprint,
}: {
  file: Pick<File, "name" | "size" | "lastModified"> | null;
  result: UserAccountImportDryRunResult | null;
  mode: string;
  submitting: boolean;
  fingerprint: UserAccountImportFileFingerprint | null;
}): UserAccountImportApplyEligibility => {
  if (submitting) {
    return { canApply: false, reason: "User account import apply is already running." };
  }

  if (mode !== userAccountImportApplyMode) {
    return {
      canApply: false,
      reason: "Only CREATE_ONLY_PENDING_NO_CREDENTIAL user account import apply is supported.",
    };
  }

  if (!file) {
    return { canApply: false, reason: "Select one user account CSV file first." };
  }

  if (!result) {
    return { canApply: false, reason: "Run user account CSV dry-run before apply." };
  }

  if (!isSameUserAccountImportFile(file, fingerprint)) {
    return { canApply: false, reason: "The selected file changed after dry-run. Run dry-run again." };
  }

  if (result.importType !== "USER_ACCOUNT" || result.dryRun !== true) {
    return { canApply: false, reason: "Only user account dry-run results can be applied here." };
  }

  if (result.summary.totalRows <= 0) {
    return { canApply: false, reason: "User account import apply requires at least one row." };
  }

  if (result.summary.existingEmployeeNoRows > 0) {
    return {
      canApply: false,
      reason: "Resolve employeeNo business identifier conflicts before apply.",
    };
  }

  if (result.summary.errorRows > 0) {
    return { canApply: false, reason: "Resolve dry-run errors before apply." };
  }

  if (result.summary.warningRows > 0) {
    return {
      canApply: false,
      reason: "Resolve dry-run warnings before pending no-credential apply.",
    };
  }

  if (result.summary.createCandidates !== result.summary.totalRows) {
    return { canApply: false, reason: "All rows must be pending create candidates." };
  }

  if (result.summary.existingUserRows > 0 || result.summary.existingRoleAssignmentRows > 0) {
    return { canApply: false, reason: "Existing users or role assignments cannot be applied." };
  }

  if (result.summary.reactivationCandidateRows > 0) {
    return { canApply: false, reason: "Revoked role reactivation candidates cannot be applied." };
  }

  if (result.rows.some((row) => row.status !== "VALID")) {
    return { canApply: false, reason: "All user account import rows must be VALID." };
  }

  if (result.rows.some((row) => row.candidateAction !== "CREATE_PENDING_USER")) {
    return {
      canApply: false,
      reason: "All user account import actions must be CREATE_PENDING_USER.",
    };
  }

  if (
    result.rows.some(
      (row) =>
        row.parsed.status !== "PENDING_ACTIVATION" ||
        row.parsed.credentialAction !== "NO_CREDENTIAL" ||
        row.parsed.scopeType !== "DEPARTMENT" ||
        row.parsed.roleCode === "SYSTEM_ADMIN",
    )
  ) {
    return {
      canApply: false,
      reason:
        "Rows must stay pending activation, no-credential, department-scoped, and non-SYSTEM_ADMIN.",
    };
  }

  return { canApply: true, reason: "Ready for pending no-credential user account apply." };
};

export const mapUserAccountImportApplyErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return {
      ...error,
      message: "User account import apply needs an active session.",
      detail: "Sign in again and rerun dry-run before applying.",
    };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return {
      ...error,
      message: "User account import apply requires system:config.",
      detail: "Use an administrator with system:config. The backend permission check remains authoritative.",
    };
  }

  if (error.status === 400 || error.kind === "bad-request") {
    return {
      ...error,
      message: "User account import apply was rejected.",
      detail: buildRejectedUserAccountApplyErrorDetail(error),
    };
  }

  if (error.kind === "network" || (error.status ?? 0) >= 500) {
    return {
      ...error,
      message: "User account import apply service is unavailable.",
      detail: "Retry after the local API is available. No user account apply result was recorded by the Web client.",
    };
  }

  return {
    ...error,
    message: error.message || "User account import apply failed.",
  };
};

const buildRejectedUserAccountApplyErrorDetail = (error: ApiError): string => {
  const summary = readRejectedUserAccountApplySummary(error.body);
  const codes = readRejectedUserAccountApplyErrorCodes(error.body);
  const safeCodeDetails = codes.map(toUserAccountImportRejectedCodeDescription);
  const canUseRawDetail = !codes.includes("EXISTING_EMPLOYEE_NO");
  const parts = [
    summary
      ? `createdUsers=${summary.createdUsersCount}; createdRoles=${summary.createdRolesCount}; skipped=${summary.skippedRows}; failed=${summary.failedRows}; errors=${summary.errorCount}; warnings=${summary.warningCount}`
      : null,
    codes.length > 0 ? `codes=${codes.join(",")}` : null,
    ...safeCodeDetails,
    canUseRawDetail ? error.detail : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join("; ") || "Backend validation rejected the pending no-credential apply request.";
};

const toUserAccountImportRejectedCodeDescription = (code: string): string | null => {
  if (code === "EXISTING_EMPLOYEE_NO") {
    return "employeeNo business identifier already exists; this row cannot create a new pending account.";
  }

  if (code === "EXISTING_USER") {
    return "email already belongs to an existing user.";
  }

  return null;
};

const readRejectedUserAccountApplySummary = (
  body: unknown,
): UserAccountImportApplyResult["summary"] | null => {
  if (typeof body !== "object" || body === null || !("summary" in body)) {
    return null;
  }

  const summary = (body as { summary?: unknown }).summary;
  if (typeof summary !== "object" || summary === null) {
    return null;
  }

  const candidate = summary as Partial<UserAccountImportApplyResult["summary"]>;
  return typeof candidate.createdUsersCount === "number" &&
    typeof candidate.createdRolesCount === "number" &&
    typeof candidate.skippedRows === "number" &&
    typeof candidate.failedRows === "number" &&
    typeof candidate.errorCount === "number" &&
    typeof candidate.warningCount === "number"
    ? {
        totalRows: typeof candidate.totalRows === "number" ? candidate.totalRows : 0,
        createdUsersCount: candidate.createdUsersCount,
        createdRolesCount: candidate.createdRolesCount,
        skippedRows: candidate.skippedRows,
        failedRows: candidate.failedRows,
        errorCount: candidate.errorCount,
        warningCount: candidate.warningCount,
        auditOperation: userAccountImportApplyAuditOperation,
      }
    : null;
};

const readRejectedUserAccountApplyErrorCodes = (body: unknown): string[] => {
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

export function UserAccountImportDryRunPanel({
  file,
  loading,
  applySubmitting = false,
  applyConfirmOpen = false,
  applyEligibility = { canApply: false, reason: "Run user account CSV dry-run before apply." },
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
  applyEligibility?: UserAccountImportApplyEligibility;
  applyResult?: UserAccountImportApplyResult | null;
  applyError?: ApiError | null;
  error: ApiError | null;
  result: UserAccountImportDryRunResult | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRunDryRun: () => void;
  onOpenApplyConfirm?: () => void;
  onCloseApplyConfirm?: () => void;
  onConfirmApply?: () => void | Promise<void>;
}) {
  return (
    <>
      <ImportDryRunPanelShell
        className="shell-card user-account-import-dry-run-card"
        title="User account CSV dry-run"
        endpoint="POST /users/import/dry-run"
        noticeMessage="dryRun=true; CSV-only; validates users, departments, roles, scopes, and conflicts before optional pending no-credential apply."
        noticeDescription="Required headers are email, displayName, departmentCode, and roleCode; optional headers are employeeNo, scopeType, scopeDepartmentCode, and status. Password, passwordHash, token, cookie, secret, invite link, and reset link columns are rejected."
        fileAriaLabel="User account CSV file"
        file={file}
        loading={loading}
        controlsDisabled={applySubmitting}
        error={error}
        result={result}
        emptyHint="Select one .csv file to preview account validation results."
        onFileChange={onFileChange}
        onRunDryRun={onRunDryRun}
        extraActions={
          <Button
            loading={applySubmitting}
            disabled={!applyEligibility.canApply || loading || applySubmitting}
            onClick={onOpenApplyConfirm}
          >
            Apply pending no-credential
          </Button>
        }
        renderResult={(dryRunResult) => (
          <UserAccountImportDryRunResultView result={dryRunResult} />
        )}
        afterResult={
          <UserAccountImportApplyStatus
            eligibility={applyEligibility}
            result={applyResult}
            error={applyError}
          />
        }
      />
      <UserAccountImportApplyConfirmModal
        open={applyConfirmOpen}
        submitting={applySubmitting}
        result={result}
        onCancel={onCloseApplyConfirm}
        onConfirm={onConfirmApply}
      />
    </>
  );
}

export function UserAccountImportDryRunResultView({
  result,
}: {
  result: UserAccountImportDryRunResult;
}) {
  const employeeNoDbCheckAvailable = result.summary.employeeNoDbConflictCheck === "AVAILABLE";

  return (
    <ImportDryRunResultShell
      result={result}
      writeSafetyDescription="no account writes, credential changes, or role assignments were requested."
      extraAlerts={
        <Alert
          type={employeeNoDbCheckAvailable ? "success" : "info"}
          showIcon
          message={`employeeNo DB conflict check: ${result.summary.employeeNoDbConflictCheck}`}
          description={
            employeeNoDbCheckAvailable
              ? "employeeNo is checked as an optional business identifier for existing-account conflicts. Account sign-in behavior is unchanged."
              : "Current schema does not persist employeeNo for account users, so the dry-run only checks employeeNo duplicates within the uploaded file."
          }
        />
      }
      summaryItems={[
        {
          label: "Create candidates",
          value: result.summary.createCandidates,
        },
        {
          label: "Existing users",
          value: result.summary.existingUserRows,
        },
        {
          label: "Existing employeeNo",
          value: result.summary.existingEmployeeNoRows,
        },
        {
          label: "Existing role assignments",
          value: result.summary.existingRoleAssignmentRows,
        },
        {
          label: "Reactivation candidates",
          value: result.summary.reactivationCandidateRows,
        },
        {
          label: "employeeNo DB check",
          value: result.summary.employeeNoDbConflictCheck,
        },
      ]}
      tableColumns={userAccountImportDryRunColumns}
      tableScrollX={1320}
      receivedColumnColor={(column) => (column === "(sensitive)" ? "red" : "geekblue")}
    />
  );
}

function UserAccountImportApplyStatus({
  eligibility,
  result,
  error,
}: {
  eligibility: UserAccountImportApplyEligibility;
  result: UserAccountImportApplyResult | null;
  error: ApiError | null;
}) {
  return (
    <Space direction="vertical" size={8} className="full-width">
      <Alert
        type={eligibility.canApply ? "success" : "info"}
        showIcon
        message={
          eligibility.canApply
            ? "Pending no-credential apply is available"
            : "Pending no-credential apply is disabled"
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
      {result ? <UserAccountImportApplyResultView result={result} /> : null}
    </Space>
  );
}

function UserAccountImportApplyResultView({
  result,
}: {
  result: UserAccountImportApplyResult;
}) {
  const errorCodes = [...new Set(result.errors.map((error) => error.code))];

  return (
    <Card size="small" title="User account apply result">
      <Space direction="vertical" size={10} className="full-width">
        <Alert
          type={result.summary.errorCount > 0 ? "warning" : "success"}
          showIcon
          message="User account apply summary"
          description="Result is sanitized. Created users remain PENDING_ACTIVATION, have no credential, and cannot log in."
        />
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Mode">{result.mode}</Descriptions.Item>
          <Descriptions.Item label="Created users">
            {result.summary.createdUsersCount}
          </Descriptions.Item>
          <Descriptions.Item label="Created roles">
            {result.summary.createdRolesCount}
          </Descriptions.Item>
          <Descriptions.Item label="Skipped rows">
            {result.summary.skippedRows}
          </Descriptions.Item>
          <Descriptions.Item label="Failed rows">
            {result.summary.failedRows}
          </Descriptions.Item>
          <Descriptions.Item label="Audit operation">
            {result.summary.auditOperation}
          </Descriptions.Item>
        </Descriptions>
        <Typography.Text type="secondary">
          Pending/no-credential status: PENDING_ACTIVATION users with department-scoped initial
          roles; no login activation is created.
        </Typography.Text>
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
          <Typography.Text type="secondary">Rejected/error summary: none.</Typography.Text>
        )}
      </Space>
    </Card>
  );
}

function UserAccountImportApplyConfirmModal({
  open,
  submitting,
  result,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  result: UserAccountImportDryRunResult | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Modal
      title="Apply user account CSV pending no-credential"
      open={open}
      okText="Apply pending no-credential"
      cancelText="Cancel"
      confirmLoading={submitting}
      okButtonProps={{ disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
      getContainer={false}
      onCancel={onCancel}
      onOk={onConfirm}
      destroyOnHidden
    >
      <UserAccountImportApplyConfirmContent result={result} />
    </Modal>
  );
}

export function UserAccountImportApplyConfirmContent({
  result,
}: {
  result: UserAccountImportDryRunResult | null;
}) {
  return (
    <Space direction="vertical" size={12} className="full-width">
      <Alert
        type="warning"
        showIcon
        message="This will create pending user account records."
        description="Mode is CREATE_ONLY_PENDING_NO_CREDENTIAL. This action does not update existing users, activate login, invite users, or reset passwords."
      />
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Endpoint">POST /users/import/apply</Descriptions.Item>
        <Descriptions.Item label="Mode">{userAccountImportApplyMode}</Descriptions.Item>
        <Descriptions.Item label="Users requested">
          {result?.summary.createCandidates ?? 0}
        </Descriptions.Item>
        <Descriptions.Item label="Audit operation">
          {userAccountImportApplyAuditOperation}
        </Descriptions.Item>
        <Descriptions.Item label="Created user status">
          PENDING_ACTIVATION
        </Descriptions.Item>
        <Descriptions.Item label="Initial role scope">
          Department-scoped UserRole only
        </Descriptions.Item>
      </Descriptions>
      <Typography.Text type="secondary">
        No UserCredential, password generation/reset, session, invite/reset/lifecycle token,
        email, or login activation will be created by this apply. The backend re-parses and
        revalidates the uploaded CSV before writing.
      </Typography.Text>
    </Space>
  );
}

const userAccountImportDryRunColumns: TableProps<UserAccountImportDryRunRow>["columns"] = [
  {
    title: "Row",
    dataIndex: "rowNumber",
    key: "rowNumber",
    width: 72,
  },
  {
    title: "Safe preview",
    key: "parsed",
    width: 360,
    render: (_, row) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>email: {row.parsed.email ?? "-"}</Typography.Text>
        <Typography.Text>displayName: {row.parsed.displayName ?? "-"}</Typography.Text>
        <Typography.Text>employeeNo: {row.parsed.employeeNo ?? "-"}</Typography.Text>
        <Typography.Text>departmentCode: {row.parsed.departmentCode ?? "-"}</Typography.Text>
        <Typography.Text>roleCode: {row.parsed.roleCode ?? "-"}</Typography.Text>
        <Typography.Text>
          scope: {row.parsed.scopeType ?? "-"} / {row.parsed.scopeDepartmentCode ?? "-"}
        </Typography.Text>
        <Typography.Text>status: {row.parsed.status ?? "-"}</Typography.Text>
        <Typography.Text>credentialAction: {row.parsed.credentialAction}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: UserAccountImportDryRunRow["status"]) => (
      <ImportDryRunStatusTag status={status} />
    ),
  },
  {
    title: "Candidate",
    dataIndex: "candidateAction",
    key: "candidateAction",
    width: 190,
  },
  {
    title: "Errors",
    dataIndex: "errors",
    key: "errors",
    width: 300,
    render: (issues: UserAccountImportDryRunIssue[]) =>
      renderImportDryRunIssueList(toUserAccountImportDisplayIssues(issues), "error"),
  },
  {
    title: "Warnings",
    dataIndex: "warnings",
    key: "warnings",
    width: 300,
    render: (issues: UserAccountImportDryRunIssue[]) =>
      renderImportDryRunIssueList(toUserAccountImportDisplayIssues(issues), "warning"),
  },
];

const toUserAccountImportDisplayIssues = (
  issues: readonly UserAccountImportDryRunIssue[],
): UserAccountImportDryRunIssue[] =>
  issues.map((issue) =>
    issue.code === "EXISTING_EMPLOYEE_NO"
      ? {
          ...issue,
          message:
            "employeeNo is already registered as a business identifier; this row cannot create a new pending account.",
        }
      : issue,
  );

const toValidationError = (message: string | null): ApiError | null =>
  message
    ? {
        kind: "bad-request",
        message,
      }
    : null;

export const buildActiveDepartmentOptions = (
  departments: DepartmentSummary[],
): DepartmentOption[] =>
  departments
    .filter((department) => department.status === "ACTIVE")
    .map((department) => ({
      value: department.id,
      label: `${department.name} / ${department.code}`,
    }));

export const getDepartmentSelectorErrorDescription = (error: ApiError): string =>
  error.detail ?? error.message;

export const buildCreateAccountUserPayload = (
  values: CreateUserFormValues,
): CreateAccountUserInput => {
  const initialPassword = values.initialPassword?.trim();

  return {
    email: values.email.trim(),
    name: values.name.trim(),
    departmentId: values.departmentId.trim(),
    roles: values.roles.map((role) => buildRolePayload(role)),
    ...(initialPassword ? { initialPassword } : {}),
  };
};

export const buildCreateInvitePayload = (
  values: CreateInviteFormValues,
): CreateInviteInput => {
  const reason = values.reason?.trim();

  return {
    email: values.email.trim(),
    name: values.name.trim(),
    departmentId: values.departmentId.trim(),
    roles: values.roles.map((role) => buildRolePayload(role)),
    ...(reason ? { reason } : {}),
  };
};

export const buildReasonPayload = <T extends ReasonFormValues>(
  values: T,
): DisableAccountUserInput & EnableAccountUserInput & RevokeAccountUserRoleInput => {
  const reason = values.reason?.trim();
  return reason ? { reason } : {};
};

export const buildAssignRolePayload = (
  values: AssignRoleFormValues,
): AssignAccountUserRoleInput => {
  if (!values.roleCode || !values.scopeType) {
    throw new Error("Role code and scope type are required.");
  }

  const reason = values.reason?.trim();
  const base = buildRolePayload({
    roleCode: values.roleCode,
    scopeType: values.scopeType,
    departmentId: values.departmentId,
  });

  return {
    ...base,
    ...(reason ? { reason } : {}),
  };
};

export const buildChangeDepartmentPayload = (
  values: ChangeDepartmentFormValues,
): ChangeAccountUserDepartmentInput => {
  if (!values.departmentId?.trim()) {
    throw new Error("Department id is required.");
  }

  const reason = values.reason?.trim();

  return {
    departmentId: values.departmentId.trim(),
    ...(reason ? { reason } : {}),
  };
};

export const createAccountUserFromForm = async (
  client: Pick<AccountManagementApiClient, "createAccountUser">,
  values: CreateUserFormValues,
): Promise<AccountUserDetail> => client.createAccountUser(buildCreateAccountUserPayload(values));

export const createInviteFromForm = async (
  client: Pick<AccountManagementApiClient, "createInvite">,
  values: CreateInviteFormValues,
): Promise<InviteIssueResponse> => client.createInvite(buildCreateInvitePayload(values));

export const executeAccountOperation = async ({
  apiClient,
  operation,
  reasonValues = {},
  assignRoleValues,
  departmentValues,
}: {
  apiClient: Pick<
    AccountManagementApiClient,
    | "getAccountUser"
    | "disableAccountUser"
    | "enableAccountUser"
    | "assignAccountUserRole"
    | "revokeAccountUserRole"
    | "changeAccountUserDepartment"
    | "resendInvite"
    | "requestAdminPasswordReset"
    | "revokePasswordResetTokens"
  >;
  operation: OperationRequest;
  reasonValues?: ReasonFormValues;
  assignRoleValues?: AssignRoleFormValues;
  departmentValues?: ChangeDepartmentFormValues;
}): Promise<AccountUserDetail> => {
  if (operation.kind === "disable") {
    const response = await apiClient.disableAccountUser(
      operation.user.id,
      buildReasonPayload(reasonValues),
    );
    return response.user;
  }

  if (operation.kind === "enable") {
    return apiClient.enableAccountUser(operation.user.id, buildReasonPayload(reasonValues));
  }

  if (operation.kind === "resend-invite") {
    await apiClient.resendInvite(operation.user.id);
    return apiClient.getAccountUser(operation.user.id);
  }

  if (operation.kind === "admin-password-reset") {
    await apiClient.requestAdminPasswordReset(
      operation.user.id,
      buildReasonPayload(reasonValues),
    );
    return apiClient.getAccountUser(operation.user.id);
  }

  if (operation.kind === "revoke-password-reset") {
    await apiClient.revokePasswordResetTokens(
      operation.user.id,
      buildReasonPayload(reasonValues),
    );
    return apiClient.getAccountUser(operation.user.id);
  }

  if (operation.kind === "assign-role") {
    const response = await apiClient.assignAccountUserRole(
      operation.user.id,
      buildAssignRolePayload(assignRoleValues ?? {}),
    );
    return response.user;
  }

  if (operation.kind === "revoke-role") {
    return apiClient.revokeAccountUserRole(
      operation.user.id,
      operation.userRole.id,
      buildReasonPayload(reasonValues),
    );
  }

  return apiClient.changeAccountUserDepartment(
    operation.user.id,
    buildChangeDepartmentPayload(departmentValues ?? {}),
  );
};

const buildRolePayload = ({
  roleCode,
  scopeType,
  departmentId,
}: {
  roleCode?: AccountRoleCode;
  scopeType?: AccountRoleScopeType;
  departmentId?: string;
}) => {
  if (!roleCode || !scopeType) {
    throw new Error("Role code and scope type are required.");
  }

  const trimmedDepartmentId = departmentId?.trim();

  if (scopeType === "DEPARTMENT" && !trimmedDepartmentId) {
    throw new Error("Department scope requires department id.");
  }

  return {
    roleCode,
    scopeType,
    ...(scopeType === "DEPARTMENT" ? { departmentId: trimmedDepartmentId } : {}),
  };
};

const trimAccountUserFilters = (filters: AccountUserFilters): AccountUserFilters => {
  const keyword = filters.keyword?.trim();
  const departmentId = filters.departmentId?.trim();

  return {
    keyword: keyword || undefined,
    status: filters.status,
    departmentId: departmentId || undefined,
    roleCode: filters.roleCode,
  };
};

const hasActiveAccountUserFilters = (filters: AccountUserFilters): boolean =>
  Boolean(filters.keyword?.trim() || filters.status || filters.departmentId?.trim() || filters.roleCode);

const createAccountUserColumns = (
  onViewDetail: (userId: string) => void,
  onOperation: (request: OperationRequest) => void,
): TableProps<AccountUserSummary>["columns"] => [
  {
    title: "用户",
    key: "user",
    width: 260,
    render: (_, user) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{user.name}</Typography.Text>
        <Typography.Text type="secondary" ellipsis>
          {user.email}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 112,
    render: (value: AccountUserStatus) => renderUserStatusTag(value),
  },
  {
    title: "部门",
    dataIndex: "department",
    key: "department",
    width: 220,
    render: (department: AccountUserSummary["department"]) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{department.name}</Typography.Text>
        <Typography.Text type="secondary">{department.code}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "角色",
    dataIndex: "roles",
    key: "roles",
    width: 260,
    render: (roles: AccountUserSummary["roles"]) => (
      <Space size={[4, 4]} wrap>
        {roles.length > 0 ? (
          roles.map((userRole) => renderRoleTag(userRole.role.code, userRole.id))
        ) : (
          <Tag>无角色</Tag>
        )}
      </Space>
    ),
  },
  {
    title: "凭证",
    dataIndex: "credential",
    key: "credential",
    width: 132,
    render: (credential: AccountUserSummary["credential"]) =>
      credential ? (
        <Tag color={credential.status === "ACTIVE" ? "green" : "orange"}>
          {credentialStatusLabels[credential.status] ?? credential.status}
        </Tag>
      ) : (
        <Tag>无凭证</Tag>
      ),
  },
  {
    title: "Lifecycle delivery",
    dataIndex: "recentLifecycleDelivery",
    key: "recentLifecycleDelivery",
    width: 220,
    render: (delivery: AccountUserSummary["recentLifecycleDelivery"]) =>
      renderLifecycleDeliverySummary(delivery),
  },
  {
    title: "最近登录",
    dataIndex: "lastLogin",
    key: "lastLogin",
    width: 176,
    render: (lastLogin: AccountUserSummary["lastLogin"]) =>
      formatDateTime(lastLogin?.lastSeenAt ?? lastLogin?.createdAt),
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: "操作入口",
    key: "actions",
    fixed: "right",
    width: 220,
    render: (_, user) => (
      <Space>
        <Button size="small" onClick={() => onViewDetail(user.id)}>
          查看详情
        </Button>
        {user.status === "ACTIVE" ? (
          <Button danger size="small" onClick={() => onOperation({ kind: "disable", user })}>
            禁用
          </Button>
        ) : user.status === "DISABLED" ? (
          <Button size="small" onClick={() => onOperation({ kind: "enable", user })}>
            启用
          </Button>
        ) : null}
      </Space>
    ),
  },
];

function AccountUserDetailView({
  user,
  permissions,
  onOperation,
}: {
  user: AccountUserDetail;
  permissions: { canInvite: boolean; canResetPassword: boolean };
  onOperation: (request: OperationRequest) => void;
}) {
  return (
    <Space direction="vertical" size={16} className="full-width">
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
        <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
        <Descriptions.Item label="状态">{renderUserStatusTag(user.status)}</Descriptions.Item>
        <Descriptions.Item label="部门">
          {user.department.name} / {user.department.code}
        </Descriptions.Item>
        <Descriptions.Item label="凭证状态">
          {user.credential ? credentialStatusLabels[user.credential.status] ?? user.credential.status : "无凭证"}
        </Descriptions.Item>
        <Descriptions.Item label="登录能力">
          {getCredentialAccessLabel(user)}
        </Descriptions.Item>
        <Descriptions.Item label="最近生命周期交付">
          {renderLifecycleDeliverySummary(user.recentLifecycleDelivery)}
        </Descriptions.Item>
        <Descriptions.Item label="最近登录">
          {formatDateTime(user.lastLogin?.lastSeenAt ?? user.lastLogin?.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDateTime(user.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{formatDateTime(user.updatedAt)}</Descriptions.Item>
      </Descriptions>
      <Card className="shell-card" title="Lifecycle actions">
        <Space size={8} wrap>
          {permissions.canInvite && user.status === "PENDING_ACTIVATION" ? (
            <Button onClick={() => onOperation({ kind: "resend-invite", user })}>
              Resend invite
            </Button>
          ) : null}
          {permissions.canResetPassword && user.status === "ACTIVE" ? (
            <>
              <Button onClick={() => onOperation({ kind: "admin-password-reset", user })}>
                Issue reset
              </Button>
              <Button onClick={() => onOperation({ kind: "revoke-password-reset", user })}>
                Revoke reset links
              </Button>
            </>
          ) : null}
          {!permissions.canInvite && !permissions.canResetPassword ? (
            <Tag>No lifecycle permission</Tag>
          ) : null}
          <Typography.Text type="secondary">
            Local demo delivery only. The admin UI shows delivery status, adapter, target user,
            and masked email; tokens, hashes, links, passwords, and sessions are never shown.
          </Typography.Text>
        </Space>
      </Card>
      <Card className="shell-card" title="账号操作">
        <Space size={8} wrap>
          {user.status === "ACTIVE" ? (
            <Button danger onClick={() => onOperation({ kind: "disable", user })}>
              禁用用户
            </Button>
          ) : user.status === "DISABLED" ? (
            <Button onClick={() => onOperation({ kind: "enable", user })}>启用用户</Button>
          ) : null}
          <Button onClick={() => onOperation({ kind: "assign-role", user })}>分配角色</Button>
          <Button onClick={() => onOperation({ kind: "change-department", user })}>
            变更部门
          </Button>
        </Space>
      </Card>
      <Card className="shell-card" title="角色范围">
        <Space size={[6, 6]} wrap>
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <Space key={role.id} className="account-role-row" size={8} wrap>
                <Tag>
                  {getRoleLabel(role.role.code)} / {role.scopeType}
                  {role.departmentId ? ` / ${role.departmentId}` : ""}
                </Tag>
                <Button
                  danger
                  size="small"
                  onClick={() => onOperation({ kind: "revoke-role", user, userRole: role })}
                >
                  撤销
                </Button>
              </Space>
            ))
          ) : (
            <Typography.Text type="secondary">暂无角色</Typography.Text>
          )}
        </Space>
      </Card>
    </Space>
  );
}

function CreateUserDrawer({
  form,
  departmentSelector,
  open,
  submitting,
  error,
  onClose,
  onFinish,
}: {
  form: FormInstance<CreateUserFormValues>;
  departmentSelector: DepartmentSelectorState;
  open: boolean;
  submitting: boolean;
  error: ApiError | null;
  onClose: () => void;
  onFinish: (values: CreateUserFormValues) => void | Promise<void>;
}) {
  return (
    <Drawer
      className="account-operation-drawer"
      title="创建用户"
      width={680}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            创建
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <DepartmentSelectorBoundary error={departmentSelector.error} />
        <Form<CreateUserFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          initialValues={{
            roles: [{ roleCode: "RESEARCHER", scopeType: "DEPARTMENT" }],
          }}
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱。" },
              { type: "email", message: "请输入有效邮箱。" },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: "请输入姓名。" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="所属部门"
            name="departmentId"
            rules={[{ required: true, message: "请选择所属部门。" }]}
          >
            <DepartmentSelect
              departmentSelector={departmentSelector}
              placeholder="选择启用部门"
            />
          </Form.Item>
          <Form.Item
            label="初始密码（可选）"
            name="initialPassword"
            rules={[{ min: 12, message: "初始密码至少 12 位。" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.List name="roles">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={12} className="full-width">
                {fields.map((field) => (
                  <Card
                    className="account-inline-card"
                    key={field.key}
                    size="small"
                    title={`角色 ${field.name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button danger size="small" onClick={() => remove(field.name)}>
                          移除
                        </Button>
                      ) : null
                    }
                  >
                    <Space className="account-role-form-row" size={12} wrap>
                      <Form.Item
                        label="角色"
                        name={[field.name, "roleCode"]}
                        rules={[{ required: true, message: "请选择角色。" }]}
                      >
                        <Select className="account-form-select" options={roleOptions} />
                      </Form.Item>
                      <Form.Item
                        label="范围"
                        name={[field.name, "scopeType"]}
                        rules={[{ required: true, message: "请选择范围。" }]}
                      >
                        <Select
                          className="account-form-select"
                          options={scopeTypeOptions}
                          onChange={(value) => {
                            if (value === "GLOBAL") {
                              form.setFieldValue(["roles", field.name, "departmentId"], undefined);
                            }
                          }}
                        />
                      </Form.Item>
                      <Form.Item shouldUpdate noStyle>
                        {() =>
                          form.getFieldValue(["roles", field.name, "scopeType"]) === "DEPARTMENT" ? (
                            <Form.Item
                              label="范围部门"
                              name={[field.name, "departmentId"]}
                              rules={[{ required: true, message: "请选择部门范围。" }]}
                            >
                              <DepartmentSelect
                                className="account-form-input"
                                departmentSelector={departmentSelector}
                                placeholder="选择启用部门"
                              />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button onClick={() => add({ roleCode: "RESEARCHER", scopeType: "DEPARTMENT" })}>
                  添加角色
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Space>
    </Drawer>
  );
}

function CreateInviteDrawer({
  form,
  departmentSelector,
  open,
  submitting,
  error,
  onClose,
  onFinish,
}: {
  form: FormInstance<CreateInviteFormValues>;
  departmentSelector: DepartmentSelectorState;
  open: boolean;
  submitting: boolean;
  error: ApiError | null;
  onClose: () => void;
  onFinish: (values: CreateInviteFormValues) => void | Promise<void>;
}) {
  return (
    <Drawer
      className="account-operation-drawer"
      title="Invite user"
      width={680}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            Send invite
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <Alert
          type="info"
          showIcon
          message="This step uses the local/simulated lifecycle delivery adapter for demo review. It is not a real email or SMS send, and this UI never displays generated tokens or full links."
        />
        <DepartmentSelectorBoundary error={departmentSelector.error} />
        <Form<CreateInviteFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          initialValues={{
            roles: [{ roleCode: "RESEARCHER", scopeType: "DEPARTMENT" }],
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Enter an email." },
              { type: "email", message: "Enter a valid email." },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Enter a name." }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="Primary department"
            name="departmentId"
            rules={[{ required: true, message: "Select a department." }]}
          >
            <DepartmentSelect
              departmentSelector={departmentSelector}
              placeholder="Select active department"
            />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea maxLength={300} rows={3} />
          </Form.Item>
          <Form.List name="roles">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={12} className="full-width">
                {fields.map((field) => (
                  <Card
                    className="account-inline-card"
                    key={field.key}
                    size="small"
                    title={`Role ${field.name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button danger size="small" onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      ) : null
                    }
                  >
                    <Space className="account-role-form-row" size={12} wrap>
                      <Form.Item
                        label="Role"
                        name={[field.name, "roleCode"]}
                        rules={[{ required: true, message: "Select a role." }]}
                      >
                        <Select className="account-form-select" options={roleOptions} />
                      </Form.Item>
                      <Form.Item
                        label="Scope"
                        name={[field.name, "scopeType"]}
                        rules={[{ required: true, message: "Select a scope." }]}
                      >
                        <Select
                          className="account-form-select"
                          options={scopeTypeOptions}
                          onChange={(value) => {
                            if (value === "GLOBAL") {
                              form.setFieldValue(["roles", field.name, "departmentId"], undefined);
                            }
                          }}
                        />
                      </Form.Item>
                      <Form.Item shouldUpdate noStyle>
                        {() =>
                          form.getFieldValue(["roles", field.name, "scopeType"]) === "DEPARTMENT" ? (
                            <Form.Item
                              label="Scope department"
                              name={[field.name, "departmentId"]}
                              rules={[{ required: true, message: "Select a scope department." }]}
                            >
                              <DepartmentSelect
                                className="account-form-input"
                                departmentSelector={departmentSelector}
                                placeholder="Select active department"
                              />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button onClick={() => add({ roleCode: "RESEARCHER", scopeType: "DEPARTMENT" })}>
                  Add role
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Space>
    </Drawer>
  );
}

function AccountOperationModal({
  operation,
  reasonForm,
  assignRoleForm,
  departmentForm,
  departmentSelector,
  submitting,
  error,
  onCancel,
  onOk,
}: {
  operation: OperationRequest | null;
  reasonForm: FormInstance<ReasonFormValues>;
  assignRoleForm: FormInstance<AssignRoleFormValues>;
  departmentForm: FormInstance<ChangeDepartmentFormValues>;
  departmentSelector: DepartmentSelectorState;
  submitting: boolean;
  error: ApiError | null;
  onCancel: () => void;
  onOk: () => void | Promise<void>;
}) {
  const title = operation ? getOperationTitle(operation) : "";

  return (
    <Modal
      title={title}
      open={Boolean(operation)}
      okText="确认"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onOk}
      destroyOnHidden
    >
      <Space direction="vertical" size={12} className="full-width">
        {operation ? <OperationWarning operation={operation} /> : null}
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        {operation?.kind === "assign-role" || operation?.kind === "change-department" ? (
          <DepartmentSelectorBoundary error={departmentSelector.error} />
        ) : null}
        {operation?.kind === "assign-role" ? (
          <AssignRoleForm form={assignRoleForm} departmentSelector={departmentSelector} />
        ) : operation?.kind === "change-department" ? (
          <ChangeDepartmentForm form={departmentForm} departmentSelector={departmentSelector} />
        ) : (
          <ReasonForm form={reasonForm} />
        )}
      </Space>
    </Modal>
  );
}

const getOperationTitle = (operation: OperationRequest): string => {
  if (operation.kind === "disable") {
    return `禁用用户：${operation.user.name}`;
  }

  if (operation.kind === "enable") {
    return `启用用户：${operation.user.name}`;
  }

  if (operation.kind === "resend-invite") {
    return `Resend invite: ${operation.user.name}`;
  }

  if (operation.kind === "admin-password-reset") {
    return `Issue password reset: ${operation.user.name}`;
  }

  if (operation.kind === "revoke-password-reset") {
    return `Revoke password reset links: ${operation.user.name}`;
  }

  if (operation.kind === "assign-role") {
    return `分配角色：${operation.user.name}`;
  }

  if (operation.kind === "revoke-role") {
    return `撤销角色：${operation.user.name}`;
  }

  return `变更部门：${operation.user.name}`;
};

const getOperationSuccessMessage = (kind: OperationRequest["kind"]): string => {
  if (kind === "disable") {
    return "用户已禁用";
  }

  if (kind === "enable") {
    return "用户已启用";
  }

  if (kind === "resend-invite") {
    return "Invite delivery queued";
  }

  if (kind === "admin-password-reset") {
    return "Password reset delivery queued";
  }

  if (kind === "revoke-password-reset") {
    return "Password reset links revoked";
  }

  if (kind === "assign-role") {
    return "角色已分配";
  }

  if (kind === "revoke-role") {
    return "角色已撤销";
  }

  return "部门已变更";
};

function OperationWarning({ operation }: { operation: OperationRequest }) {
  if (operation.kind === "disable") {
    return (
      <Alert
        type="warning"
        showIcon
        message="禁用用户会禁用 active credential，并撤销 active sessions。"
      />
    );
  }

  if (operation.kind === "enable") {
    return (
      <Alert
        type="info"
        showIcon
        message="启用用户不会自动恢复已禁用 credential。"
      />
    );
  }

  if (operation.kind === "resend-invite") {
    return (
      <Alert
        type="info"
        showIcon
        message="A new local/simulated invite delivery will be queued. This is not a real email or SMS send; the UI will not display a token or full invitation link."
      />
    );
  }

  if (operation.kind === "admin-password-reset") {
    return (
      <Alert
        type="warning"
        showIcon
        message="A local/simulated password reset delivery will be queued. This is not a real email or SMS send; the user must sign in again after completing the reset."
      />
    );
  }

  if (operation.kind === "revoke-password-reset") {
    return (
      <Alert
        type="warning"
        showIcon
        message="Active password reset links for this user will be revoked."
      />
    );
  }

  if (operation.kind === "revoke-role") {
    return (
      <Alert
        type="warning"
        showIcon
        message={`将撤销 ${getRoleLabel(operation.userRole.role.code)} / ${operation.userRole.scopeType}。`}
      />
    );
  }

  if (operation.kind === "change-department") {
    return (
      <Alert
        type="warning"
        showIcon
        message="部门变更不会迁移历史成果、费用、审批，也不会自动迁移 scoped roles。"
      />
    );
  }

  return <Alert type="info" showIcon message="角色分配成功后会刷新当前用户详情。" />;
}

function ReasonForm({ form }: { form: FormInstance<ReasonFormValues> }) {
  return (
    <Form<ReasonFormValues> form={form} layout="vertical" requiredMark={false}>
      <Form.Item label="原因（可选）" name="reason">
        <Input.TextArea maxLength={300} rows={3} />
      </Form.Item>
    </Form>
  );
}

function DepartmentSelectorBoundary({ error }: { error: ApiError | null }) {
  if (!error) {
    return null;
  }

  return (
    <Alert
      type="warning"
      showIcon
      message="无法加载启用部门选项"
      description="账号绑定仍由后端校验；请稍后刷新后再选择部门。"
    />
  );
}

type DepartmentSelectProps = Omit<
  SelectProps<string>,
  "loading" | "options" | "optionFilterProp" | "showSearch" | "notFoundContent"
> & {
  departmentSelector: DepartmentSelectorState;
  placeholder: string;
};

function DepartmentSelect({
  departmentSelector,
  className,
  placeholder,
  disabled,
  ...selectProps
}: DepartmentSelectProps) {
  return (
    <Select
      {...selectProps}
      className={className}
      loading={departmentSelector.loading}
      disabled={disabled || Boolean(departmentSelector.error)}
      showSearch
      optionFilterProp="label"
      options={departmentSelector.options}
      placeholder={placeholder}
      notFoundContent={departmentSelector.loading ? "正在加载部门" : "暂无启用部门"}
    />
  );
}

function AssignRoleForm({
  form,
  departmentSelector,
}: {
  form: FormInstance<AssignRoleFormValues>;
  departmentSelector: DepartmentSelectorState;
}) {
  return (
    <Form<AssignRoleFormValues> form={form} layout="vertical" requiredMark={false}>
      <Form.Item label="角色" name="roleCode" rules={[{ required: true, message: "请选择角色。" }]}>
        <Select options={roleOptions} />
      </Form.Item>
      <Form.Item label="范围" name="scopeType" rules={[{ required: true, message: "请选择范围。" }]}>
        <Select
          options={scopeTypeOptions}
          onChange={(value) => {
            if (value === "GLOBAL") {
              form.setFieldValue("departmentId", undefined);
            }
          }}
        />
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue("scopeType") === "DEPARTMENT" ? (
            <Form.Item
              label="范围部门"
              name="departmentId"
              rules={[{ required: true, message: "请选择部门范围。" }]}
            >
              <DepartmentSelect
                departmentSelector={departmentSelector}
                placeholder="选择启用部门"
              />
            </Form.Item>
          ) : null
        }
      </Form.Item>
      <Form.Item label="原因（可选）" name="reason">
        <Input.TextArea maxLength={300} rows={3} />
      </Form.Item>
    </Form>
  );
}

function ChangeDepartmentForm({
  form,
  departmentSelector,
}: {
  form: FormInstance<ChangeDepartmentFormValues>;
  departmentSelector: DepartmentSelectorState;
}) {
  return (
    <Form<ChangeDepartmentFormValues> form={form} layout="vertical" requiredMark={false}>
      <Form.Item
        label="新部门"
        name="departmentId"
        rules={[{ required: true, message: "请选择新部门。" }]}
      >
        <DepartmentSelect
          departmentSelector={departmentSelector}
          placeholder="选择启用部门"
        />
      </Form.Item>
      <Form.Item label="原因（可选）" name="reason">
        <Input.TextArea maxLength={300} rows={3} />
      </Form.Item>
    </Form>
  );
}

const renderUserStatusTag = (status: AccountUserStatus) => {
  const color = status === "ACTIVE" ? "green" : status === "DISABLED" ? "orange" : "default";
  return <Tag color={color}>{statusLabels[status] ?? status}</Tag>;
};

const renderRoleTag = (code: AccountRoleCode | string, id: string) => (
  <Tag key={id}>{getRoleLabel(code)}</Tag>
);

const getRoleLabel = (code: AccountRoleCode | string): string =>
  roleLabels[code as AccountRoleCode] ?? code;

const getCredentialAccessLabel = (user: AccountUserSummary): string => {
  if (user.status !== "ACTIVE") {
    return "不可登录：账号未激活或不可用";
  }

  if (!user.credential) {
    return "不可登录：尚无本地凭证";
  }

  if (user.credential.status !== "ACTIVE") {
    return "不可登录：凭证不可用";
  }

  return "可登录：账号与凭证均为 ACTIVE";
};

const renderLifecycleDeliverySummary = (
  delivery: AccountLifecycleDeliverySummary | null,
) => {
  if (!delivery) {
    return <Tag>无模拟交付记录</Tag>;
  }

  return (
    <Space direction="vertical" size={2}>
      <Space size={4} wrap>
        <Tag color={getLifecycleDeliveryStatusColor(delivery.deliveryStatus)}>
          {delivery.deliveryStatus ?? "NO_STATUS"}
        </Tag>
        <Tag>{delivery.deliveryAdapter ?? "NO_ADAPTER"}</Tag>
        <Tag>{delivery.purpose}</Tag>
      </Space>
      <Typography.Text type="secondary">
        {delivery.maskedEmail} / target {delivery.targetUserId ?? "unknown"}
      </Typography.Text>
      <Typography.Text type="secondary">
        token {delivery.tokenStatus}; failure {delivery.failureCategory ?? "not persisted"}
      </Typography.Text>
      <Typography.Text type="secondary">
        updated {formatDateTime(delivery.updatedAt)}
      </Typography.Text>
    </Space>
  );
};

const getLifecycleDeliveryStatusColor = (
  status: AccountLifecycleDeliverySummary["deliveryStatus"],
): string => {
  if (status === "SENT") {
    return "green";
  }

  if (status === "FAILED" || status === "SUPPRESSED") {
    return "orange";
  }

  if (status === "PENDING" || status === "QUEUED") {
    return "blue";
  }

  return "default";
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
