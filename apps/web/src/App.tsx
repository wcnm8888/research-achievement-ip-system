import { Alert, Button, Form, Input, Layout, Menu, Select, Space, Spin, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { appName } from "./app-meta";
import "./App.css";
import { Achievements } from "./Achievements";
import { AccountManagement, hasSystemConfigPermission } from "./AccountManagement";
import {
  AccountLifecycleAccess,
  parsePublicLifecycleIntent,
  type PublicLifecycleIntent,
} from "./AccountLifecycleAccess";
import {
  createAuthClient,
  isApiError,
  type AuthClient,
  type AuthUser,
  type LoginRequest,
} from "./api-client";
import { AuditLogs } from "./AuditLogs";
import { BoundaryNotice, PermissionHint, SectionHeader } from "./components/StateBlocks";
import {
  demoUserPresets,
  findDemoUserPreset,
  readStoredDemoUserId,
  storeDemoUserId,
} from "./demo-users";
import { Dashboard } from "./Dashboard";
import { DepartmentManagement } from "./DepartmentManagement";
import { Fees } from "./Fees";
import { Search } from "./Search";
import { SettingsApiIntegrations } from "./SettingsApiIntegrations";
import { Workbench } from "./Workbench";
import { WorkflowTasks } from "./WorkflowTasks";

const { Header, Sider, Content } = Layout;

type AuthStatus = "checking" | "anonymous" | "authenticated" | "error";

type NavItem = {
  key: string;
  label: string;
  step: string;
  description: string;
};

export const navItems: NavItem[] = [
  {
    key: "workbench",
    label: "工作台",
    step: "Step 11",
    description: "工作台是本轮唯一主要内容，读取 summary 和我的审批待办。",
  },
  {
    key: "achievements",
    label: "成果管理",
    step: "Step 12",
    description: "Step 12 提供真实成果列表、登记/编辑、详情查看和提交/作废/归档入口。",
  },
  {
    key: "workflow",
    label: "审批管理",
    step: "Step 13",
    description: "Step 13 已提供我的审批待办列表、任务详情以及通过/驳回处理入口。",
  },
  {
    key: "fees",
    label: "费用管理",
    step: "Step 15A",
    description: "Step 15A 提供只读费用台账、状态筛选和前端派生预警摘要。",
  },
  {
    key: "search",
    label: "检索中心",
    step: "Step 16",
    description: "Step 16 已完成只读检索、高级筛选、结果摘要、成果详情和费用详情联动，复用后端 GET /search、GET /achievements/:id 与 GET /fees/:id。",
  },
  {
    key: "dashboard",
    label: "统计看板",
    step: "Step 17",
    description:
      "Step 17 提供只读 dashboard summary 前端闭环，展示基础摘要、五组分布和 7/30/90 天窗口，不伪造完整报表能力。",
  },
  {
    key: "audit",
    label: "审计日志",
    step: "Step 18B",
    description:
      "Step 18B 提供 masked readonly 审计日志前端页面，只调用 GET /audit-logs，不提供导出、unmasked 或写入入口。",
  },
  {
    key: "settings",
    label: "系统配置",
    step: "Step 51E",
    description: "Step 51E provides API integrations metadata management through system:config.",
  },
  {
    key: "account-management",
    label: "账号管理",
    step: "Step 36E-2",
    description: "Step 36E-2 提供账号列表和详情只读 UI，不提供创建、禁用启用、角色或部门写入操作。",
  },
  {
    key: "department-management",
    label: "部门维护",
    step: "Step 37E",
    description: "Step 37E 提供部门列表、树形展示、创建、编辑、启用和停用 UI，权限由 system:config 收敛。",
  },
];

const fallbackNavItem = navItems[0] as NavItem;

export const isProductionAuthMode = (): boolean => import.meta.env.PROD;

export const shouldShowDemoIdentityControls = (productionAuthMode: boolean): boolean =>
  !productionAuthMode;

export const getBusinessContextId = ({
  productionAuthMode,
  demoUserId,
  authUser,
}: {
  productionAuthMode: boolean;
  demoUserId: string | null;
  authUser: Pick<AuthUser, "id"> | null;
}): string | null => (productionAuthMode ? authUser?.id ?? null : demoUserId);

export const getVisibleNavItems = (
  items: readonly NavItem[],
  authUser: Pick<AuthUser, "permissionCodes"> | null,
): NavItem[] =>
  items.filter(
    (item) =>
      !["account-management", "department-management"].includes(item.key) ||
      hasSystemConfigPermission(authUser),
  );

export const getDemoAuthUser = (demoUserId: string | null): AuthUser | null => {
  const preset = findDemoUserPreset(demoUserId);

  if (!preset) {
    return null;
  }

  const permissionCodes =
    preset.role === "SYSTEM_ADMIN"
      ? ["system:config"]
      : preset.role === "RESEARCHER"
        ? ["achievement:create", "achievement:update_own"]
        : ["achievement:read_department", "fee:read_department"];

  return {
    id: preset.userId,
    email: "",
    name: preset.label,
    departmentId: "",
    roleCodes: [preset.role],
    permissionCodes,
    scopedDepartmentIds: [],
  };
};

export const mapAuthCheckErrorToStatus = (error: unknown): AuthStatus =>
  isApiError(error) && error.kind === "unauthorized" ? "anonymous" : "error";

export const loginAndRefreshCurrentUser = async (
  authClient: AuthClient,
  payload: LoginRequest,
): Promise<AuthUser> => {
  await authClient.login(payload);
  const response = await authClient.me();
  return response.user;
};

export const mapLoginErrorMessage = (error: unknown): string => {
  if (isApiError(error) && error.kind === "unauthorized") {
    return "邮箱或密码错误。";
  }

  return isApiError(error) ? error.message : "Login failed.";
};

export const logoutAndClearCurrentUser = async (authClient: AuthClient): Promise<null> => {
  await authClient.logout();
  return null;
};

export function App() {
  const [activeKey, setActiveKey] = useState("workbench");
  const productionAuthMode = isProductionAuthMode();
  const authClient = useMemo(() => createAuthClient(), []);
  const [publicLifecycleIntent, setPublicLifecycleIntent] = useState<PublicLifecycleIntent>(() =>
    parsePublicLifecycleIntent(window.location.href),
  );
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    productionAuthMode ? "checking" : "anonymous",
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [demoUserId, setDemoUserId] = useState<string | null>(() => readStoredDemoUserId());
  const [customUserId, setCustomUserId] = useState("");
  const activeUser = useMemo(() => findDemoUserPreset(demoUserId), [demoUserId]);
  const demoAuthUser = useMemo(() => getDemoAuthUser(demoUserId), [demoUserId]);
  const effectiveAuthUser = productionAuthMode ? authUser : demoAuthUser;
  const businessContextId = getBusinessContextId({
    productionAuthMode,
    demoUserId,
    authUser,
  });
  const visibleNavItems = useMemo(
    () => getVisibleNavItems(navItems, effectiveAuthUser),
    [effectiveAuthUser],
  );

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.key === activeKey)) {
      setActiveKey(fallbackNavItem.key);
    }
  }, [activeKey, visibleNavItems]);

  useEffect(() => {
    if (!productionAuthMode) {
      return;
    }

    let cancelled = false;

    void authClient
      .me()
      .then((response) => {
        if (cancelled) {
          return;
        }

        setAuthUser(response.user);
        setAuthStatus("authenticated");
        setAuthError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setAuthUser(null);
        setAuthStatus(mapAuthCheckErrorToStatus(error));
        setAuthError(isApiError(error) && error.kind !== "unauthorized" ? error.message : null);
      });

    return () => {
      cancelled = true;
    };
  }, [authClient, productionAuthMode]);

  const updateDemoUser = (userId: string | null) => {
    setDemoUserId(userId);
    storeDemoUserId(userId);
  };

  const applyCustomUser = () => {
    updateDemoUser(customUserId.trim() || null);
  };

  const handleLogin = async (values: LoginRequest) => {
    setLoginSubmitting(true);
    setAuthError(null);

    try {
      const user = await loginAndRefreshCurrentUser(authClient, values);
      setAuthUser(user);
      setAuthStatus("authenticated");
    } catch (error) {
      setAuthUser(null);
      setAuthStatus(mapAuthCheckErrorToStatus(error));
      setAuthError(mapLoginErrorMessage(error));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setAuthUser(await logoutAndClearCurrentUser(authClient));
    setAuthStatus("anonymous");
  };

  const showForgotPassword = () => {
    setPublicLifecycleIntent({ mode: "forgot-password" });
  };

  const showLogin = () => {
    setPublicLifecycleIntent({ mode: "login" });
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand-block">
          <Typography.Title level={4}>{appName}</Typography.Title>
          <Typography.Text type="secondary">Phase 1 frontend</Typography.Text>
        </div>
        {shouldShowDemoIdentityControls(productionAuthMode) ? (
          <DemoIdentityControls
            customUserId={customUserId}
            demoUserId={demoUserId}
            onApplyCustomUser={applyCustomUser}
            onCustomUserIdChange={setCustomUserId}
            onDemoUserChange={updateDemoUser}
          />
        ) : (
          <ProductionIdentityControls
            authStatus={authStatus}
            authUser={authUser}
            onLogout={handleLogout}
          />
        )}
      </Header>
      {productionAuthMode && authStatus !== "authenticated" ? (
        <Content className="app-content auth-login-content">
          {publicLifecycleIntent.mode === "login" ? (
            <ProductionLoginPanel
              authError={authError}
              authStatus={authStatus}
              loading={loginSubmitting}
              onForgotPassword={showForgotPassword}
              onLogin={handleLogin}
            />
          ) : (
            <AccountLifecycleAccess
              authClient={authClient}
              intent={publicLifecycleIntent}
              onBackToLogin={showLogin}
            />
          )}
        </Content>
      ) : (
        <Layout className="main-layout">
          <Sider width={232} className="app-sider" breakpoint="lg" collapsedWidth={0}>
            <div className="user-panel">
              <Typography.Text type="secondary">Current user</Typography.Text>
              <Typography.Text strong ellipsis>
                {productionAuthMode
                  ? authUser?.name ?? "Not signed in"
                  : activeUser?.label ?? (demoUserId ? "Custom demo user" : "Not selected")}
              </Typography.Text>
              <Typography.Text type="secondary" ellipsis>
                {productionAuthMode
                  ? authUser?.email ?? "Please sign in"
                  : activeUser?.department ?? demoUserId ?? "Select demo context"}
              </Typography.Text>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              items={visibleNavItems.map((item) => ({
                key: item.key,
                label: item.label,
              }))}
              onClick={(event) => setActiveKey(event.key)}
            />
          </Sider>
          <Content className="app-content">
            {productionAuthMode ? (
              <ProductionAuthBanner authUser={authUser} />
            ) : (
              <DemoContextBanner demoUserId={demoUserId} />
            )}
            {activeKey === "workbench" ? (
              <Workbench demoUserId={businessContextId} onNavigate={setActiveKey} />
            ) : activeKey === "achievements" ? (
              <Achievements demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : activeKey === "workflow" ? (
              <WorkflowTasks demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : activeKey === "fees" ? (
              <Fees demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : activeKey === "search" ? (
              <Search demoUserId={businessContextId} />
            ) : activeKey === "dashboard" ? (
              <Dashboard demoUserId={businessContextId} />
            ) : activeKey === "audit" ? (
              <AuditLogs demoUserId={businessContextId} />
            ) : activeKey === "settings" ? (
              <SettingsApiIntegrations demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : activeKey === "account-management" ? (
              <AccountManagement demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : activeKey === "department-management" ? (
              <DepartmentManagement demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : (
              <BoundaryPage
                item={navItems.find((item) => item.key === activeKey) ?? fallbackNavItem}
              />
            )}
          </Content>
        </Layout>
      )}
    </Layout>
  );
}

function DemoIdentityControls({
  customUserId,
  demoUserId,
  onApplyCustomUser,
  onCustomUserIdChange,
  onDemoUserChange,
}: {
  customUserId: string;
  demoUserId: string | null;
  onApplyCustomUser: () => void;
  onCustomUserIdChange: (value: string) => void;
  onDemoUserChange: (userId: string | null) => void;
}) {
  return (
    <div className="identity-bar">
      <Tag color="gold">demo/staging identity</Tag>
      <Select
        className="demo-user-select"
        allowClear
        placeholder="Select demo user"
        value={demoUserId ?? undefined}
        onChange={(value) => onDemoUserChange(value ?? null)}
        options={demoUserPresets.map((preset) => ({
          value: preset.userId,
          label: `${preset.label} / ${preset.role}`,
        }))}
      />
      <Input.Search
        className="demo-user-input"
        placeholder="X-Demo-User-Id"
        enterButton="Apply"
        value={customUserId}
        onChange={(event) => onCustomUserIdChange(event.target.value)}
        onSearch={onApplyCustomUser}
      />
      {demoUserId ? <Button onClick={() => onDemoUserChange(null)}>Clear</Button> : null}
    </div>
  );
}

function ProductionIdentityControls({
  authStatus,
  authUser,
  onLogout,
}: {
  authStatus: AuthStatus;
  authUser: AuthUser | null;
  onLogout: () => void;
}) {
  return (
    <div className="identity-bar">
      <Tag color={authStatus === "authenticated" ? "green" : "blue"}>production auth</Tag>
      {authUser ? (
        <>
          <Typography.Text strong>{authUser.name}</Typography.Text>
          <Typography.Text type="secondary">{authUser.email}</Typography.Text>
          <Button onClick={onLogout}>Logout</Button>
        </>
      ) : (
        <Typography.Text type="secondary">
          {authStatus === "checking" ? "Checking session" : "Please sign in"}
        </Typography.Text>
      )}
    </div>
  );
}

export function ProductionLoginPanel({
  authError,
  authStatus,
  loading,
  onLogin,
  onForgotPassword,
}: {
  authError: string | null;
  authStatus: AuthStatus;
  loading: boolean;
  onLogin: (values: LoginRequest) => void | Promise<void>;
  onForgotPassword?: () => void;
}) {
  if (authStatus === "checking") {
    return (
      <div className="auth-login-panel">
        <Spin />
        <Typography.Text type="secondary">Checking session</Typography.Text>
      </div>
    );
  }

  return (
    <div className="auth-login-panel">
      <Space direction="vertical" size={16} className="full-width">
        <div>
          <Typography.Title level={3}>Production sign in</Typography.Title>
          <Typography.Text type="secondary">
            Sign in with a local production account. Demo user switching is disabled here.
          </Typography.Text>
        </div>
        {authError ? <Alert type="error" showIcon message={authError} /> : null}
        <Form<LoginRequest> layout="vertical" onFinish={onLogin} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email", message: "Enter a valid email." }]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Enter your password." }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Sign in
          </Button>
          {onForgotPassword ? (
            <Button type="link" onClick={onForgotPassword}>
              Forgot password
            </Button>
          ) : null}
        </Form>
      </Space>
    </div>
  );
}

function ProductionAuthBanner({ authUser }: { authUser: AuthUser | null }) {
  return (
    <div className="context-banner">
      <Space size={12} wrap>
        <Tag color="green">session</Tag>
        <Typography.Text strong>{authUser?.name ?? "Authenticated user"}</Typography.Text>
        <Typography.Text type="secondary">{authUser?.email ?? "No active session"}</Typography.Text>
      </Space>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyDemoApp() {
  const [activeKey, setActiveKey] = useState("workbench");
  const [demoUserId, setDemoUserId] = useState<string | null>(() => readStoredDemoUserId());
  const [customUserId, setCustomUserId] = useState("");
  const activeUser = useMemo(() => findDemoUserPreset(demoUserId), [demoUserId]);
  const visibleNavItems = useMemo(() => getVisibleNavItems(navItems, null), []);

  const updateDemoUser = (userId: string | null) => {
    setDemoUserId(userId);
    storeDemoUserId(userId);
  };

  const applyCustomUser = () => {
    updateDemoUser(customUserId.trim() || null);
  };

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand-block">
          <Typography.Title level={4}>{appName}</Typography.Title>
          <Typography.Text type="secondary">一期前端基座 / Step 11</Typography.Text>
        </div>
        <div className="identity-bar">
          <Tag color="gold">本地演示上下文 / 非真实 SSO</Tag>
          <Select
            className="demo-user-select"
            allowClear
            placeholder="选择演示用户"
            value={demoUserId ?? undefined}
            onChange={(value) => updateDemoUser(value ?? null)}
            options={demoUserPresets.map((preset) => ({
              value: preset.userId,
              label: `${preset.label} · ${preset.role}`,
            }))}
          />
          <Input.Search
            className="demo-user-input"
            placeholder="输入 X-Demo-User-Id"
            enterButton="应用"
            value={customUserId}
            onChange={(event) => setCustomUserId(event.target.value)}
            onSearch={applyCustomUser}
          />
          {demoUserId ? <Button onClick={() => updateDemoUser(null)}>清除</Button> : null}
        </div>
      </Header>
      <Layout className="main-layout">
        <Sider width={232} className="app-sider" breakpoint="lg" collapsedWidth={0}>
          <div className="user-panel">
            <Typography.Text type="secondary">当前用户</Typography.Text>
            <Typography.Text strong ellipsis>
              {activeUser?.label ?? (demoUserId ? "自定义演示用户" : "未选择")}
            </Typography.Text>
            <Typography.Text type="secondary" ellipsis>
              {activeUser?.department ?? demoUserId ?? "请选择演示上下文"}
            </Typography.Text>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={visibleNavItems.map((item) => ({
              key: item.key,
              label: item.label,
            }))}
            onClick={(event) => setActiveKey(event.key)}
          />
        </Sider>
        <Content className="app-content">
          <DemoContextBanner demoUserId={demoUserId} />
          {activeKey === "workbench" ? (
            <Workbench demoUserId={demoUserId} onNavigate={setActiveKey} />
          ) : activeKey === "achievements" ? (
            <Achievements demoUserId={demoUserId} />
          ) : activeKey === "workflow" ? (
            <WorkflowTasks demoUserId={demoUserId} />
          ) : activeKey === "fees" ? (
            <Fees demoUserId={demoUserId} />
          ) : activeKey === "search" ? (
            <Search demoUserId={demoUserId} />
          ) : activeKey === "dashboard" ? (
            <Dashboard demoUserId={demoUserId} />
          ) : activeKey === "audit" ? (
            <AuditLogs demoUserId={demoUserId} />
          ) : activeKey === "settings" ? (
            <SettingsApiIntegrations demoUserId={demoUserId} authUser={null} />
          ) : (
            <BoundaryPage
              item={navItems.find((item) => item.key === activeKey) ?? fallbackNavItem}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

function DemoContextBanner({ demoUserId }: { demoUserId: string | null }) {
  const preset = findDemoUserPreset(demoUserId);

  if (!demoUserId) {
    return (
      <PermissionHint description="请选择科研人员、科研秘书或系统管理员演示用户。未选择时不会访问后端业务接口。" />
    );
  }

  return (
    <div className="context-banner">
      <Space size={12} wrap>
        <Tag color="blue">X-Demo-User-Id</Tag>
        <Typography.Text copyable>{demoUserId}</Typography.Text>
        {preset ? <Tag>{preset.role}</Tag> : <Tag color="default">CUSTOM</Tag>}
        <Typography.Text type="secondary">
          {preset?.note ?? "自定义演示用户将直接透传给后端 dev/test 身份适配器。"}
        </Typography.Text>
      </Space>
    </div>
  );
}

function BoundaryPage({ item }: { item: NavItem }) {
  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader title={item.label} description={item.description} />
      <BoundaryNotice
        title={`${item.label}未在 Step 11 实现`}
        description="当前页面只提供导航入口、权限边界说明和后续计划提示，不伪装为已完成业务能力。"
        step={item.step}
      />
      <PermissionHint description="列表、详情、搜索、看板、附件下载和审计查询的最终权限裁剪必须依赖后端策略层，前端不承担最终鉴权。" />
    </Space>
  );
}
