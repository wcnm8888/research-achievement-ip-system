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
import { CustomReports } from "./CustomReports";
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
import { SecretAuthorization } from "./SecretAuthorization";
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
    step: "工作台",
    description: "工作台展示核心摘要和我的审批待办。",
  },
  {
    key: "achievements",
    label: "成果管理",
    step: "成果管理",
    description: "登记、查看、编辑并提交论文、专利和软件著作权等科研成果。",
  },
  {
    key: "workflow",
    label: "审批管理",
    step: "审批管理",
    description: "查看待办审批任务，并按权限完成通过或驳回处理。",
  },
  {
    key: "fees",
    label: "费用管理",
    step: "费用管理",
    description: "查看费用台账、缴费状态和预警摘要。",
  },
  {
    key: "search",
    label: "检索中心",
    step: "检索中心",
    description: "按权限检索成果和费用记录，查看筛选后的摘要。",
  },
  {
    key: "dashboard",
    label: "统计看板",
    step: "统计看板",
    description: "展示成果、审批、费用和风险的汇总指标。",
  },
  {
    key: "custom-reports",
    label: "自定义报表",
    step: "自定义报表",
    description: "按模板查看权限范围内的聚合统计报表。",
  },
  {
    key: "audit",
    label: "审计日志",
    step: "审计日志",
    description: "查看经脱敏处理的关键操作记录。",
  },
  {
    key: "settings",
    label: "系统配置",
    step: "系统配置",
    description: "维护系统参数和外部接口配置摘要。",
  },
  {
    key: "secret-authorization",
    label: "涉密授权管理",
    step: "涉密授权管理",
    description: "查看涉密资源和授权状态摘要。",
  },
  {
    key: "account-management",
    label: "账号管理",
    step: "账号管理",
    description: "维护账号状态、角色、部门和生命周期摘要。",
  },
  {
    key: "department-management",
    label: "部门维护",
    step: "部门维护",
    description: "维护部门列表、层级关系和启停状态。",
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
      !["account-management", "department-management", "secret-authorization"].includes(item.key) ||
      hasSystemConfigPermission(authUser),
  );

export const getDemoAuthUser = (demoUserId: string | null): AuthUser | null => {
  const preset = findDemoUserPreset(demoUserId);

  if (!preset) {
    return null;
  }

  const permissionCodes = getDemoPermissionCodes(preset.role);

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

export const getDemoPermissionCodes = (role: string): string[] => {
  if (role === "SYSTEM_ADMIN") {
    return [
      "achievement:archive",
      "achievement:read_department",
      "fee:read_department",
      "fee:review_department",
      "user_context:read",
      "system:config",
      "account:invite",
      "account:reset_password",
      "audit:read_masked",
    ];
  }

  if (role === "RESEARCHER") {
    return [
      "achievement:create",
      "achievement:read_own",
      "achievement:submit",
      "achievement:update_own",
      "attachment:read_metadata",
      "user_context:read",
    ];
  }

  if (role === "RESEARCH_SECRETARY") {
    return [
      "achievement:read_department",
      "achievement:review_department",
      "fee:manage_department",
      "fee:read_department",
      "reminder:read_department",
      "department:read_department",
      "attachment:read_metadata",
      "user_context:read",
    ];
  }

  return [];
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

  return isApiError(error) ? error.message : "登录失败，请稍后重试。";
};

export const getProductionAuthStatusTag = (
  authStatus: AuthStatus,
): { label: string; color: string } => {
  if (authStatus === "authenticated") {
    return { label: "已登录", color: "green" };
  }

  if (authStatus === "checking") {
    return { label: "检查中", color: "blue" };
  }

  if (authStatus === "error") {
    return { label: "需重新登录", color: "orange" };
  }

  return { label: "未登录", color: "default" };
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
          <Typography.Text type="secondary">科研成果与知识产权管理平台</Typography.Text>
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
              <Typography.Text type="secondary">当前用户</Typography.Text>
              <Typography.Text strong ellipsis>
                {productionAuthMode
                  ? authUser?.name ?? "未登录"
                  : activeUser?.label ?? (demoUserId ? "自定义用户" : "未选择")}
              </Typography.Text>
              <Typography.Text type="secondary" ellipsis>
                {productionAuthMode
                  ? authUser?.email ?? "请先登录"
                  : activeUser?.department ?? demoUserId ?? "请选择用户"}
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
            ) : activeKey === "custom-reports" ? (
              <CustomReports demoUserId={businessContextId} />
            ) : activeKey === "audit" ? (
              <AuditLogs demoUserId={businessContextId} />
            ) : activeKey === "settings" ? (
              <SettingsApiIntegrations demoUserId={businessContextId} authUser={effectiveAuthUser} />
            ) : activeKey === "secret-authorization" ? (
              <SecretAuthorization demoUserId={businessContextId} authUser={effectiveAuthUser} />
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
      <Tag color="gold">演示身份</Tag>
      <Select
        className="demo-user-select"
        allowClear
        placeholder="选择用户"
        value={demoUserId ?? undefined}
        onChange={(value) => onDemoUserChange(value ?? null)}
        options={demoUserPresets.map((preset) => ({
          value: preset.userId,
          label: `${preset.label} / ${preset.role}`,
        }))}
      />
      <Input.Search
        className="demo-user-input"
        placeholder="输入用户标识"
        enterButton="应用"
        value={customUserId}
        onChange={(event) => onCustomUserIdChange(event.target.value)}
        onSearch={onApplyCustomUser}
      />
      {demoUserId ? <Button onClick={() => onDemoUserChange(null)}>清除</Button> : null}
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
  const statusTag = getProductionAuthStatusTag(authStatus);

  return (
    <div className="identity-bar">
      <Tag color={statusTag.color}>{statusTag.label}</Tag>
      {authUser ? (
        <>
          <Typography.Text strong>{authUser.name}</Typography.Text>
          <Typography.Text type="secondary">{authUser.email}</Typography.Text>
          <Button onClick={onLogout}>退出登录</Button>
        </>
      ) : (
        <Typography.Text type="secondary">
          {authStatus === "checking" ? "正在检查登录状态" : "请先登录"}
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
        <Typography.Text type="secondary">正在检查登录状态</Typography.Text>
      </div>
    );
  }

  return (
    <div className="auth-login-panel">
      <Space direction="vertical" size={16} className="full-width">
        <div>
          <Typography.Title level={3}>系统登录</Typography.Title>
          <Typography.Text type="secondary">
            请使用本地已授权账号登录；此模式不提供演示身份切换。
          </Typography.Text>
        </div>
        {authError ? <Alert type="error" showIcon message={authError} /> : null}
        <Form<LoginRequest> layout="vertical" onFinish={onLogin} requiredMark={false}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ required: true, type: "email", message: "请输入有效邮箱。" }]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码。" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            登录
          </Button>
          {onForgotPassword ? (
            <Button type="link" onClick={onForgotPassword}>
              忘记密码
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
        <Tag color="green">已登录</Tag>
        <Typography.Text strong>{authUser?.name ?? "已认证用户"}</Typography.Text>
        <Typography.Text type="secondary">{authUser?.email ?? "暂无登录信息"}</Typography.Text>
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
          <Typography.Text type="secondary">科研成果与知识产权管理平台</Typography.Text>
        </div>
        <div className="identity-bar">
          <Tag color="gold">业务用户上下文</Tag>
          <Select
            className="demo-user-select"
            allowClear
            placeholder="选择业务用户"
            value={demoUserId ?? undefined}
            onChange={(value) => updateDemoUser(value ?? null)}
            options={demoUserPresets.map((preset) => ({
              value: preset.userId,
              label: `${preset.label} · ${preset.role}`,
            }))}
          />
          <Input.Search
            className="demo-user-input"
            placeholder="输入用户标识"
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
              {activeUser?.label ?? (demoUserId ? "自定义业务用户" : "未选择")}
            </Typography.Text>
            <Typography.Text type="secondary" ellipsis>
              {activeUser?.department ?? demoUserId ?? "请选择业务用户"}
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
      <PermissionHint
        variant="alert"
        description="请选择当前业务用户。未选择用户时，页面暂不加载业务数据。"
      />
    );
  }

  return (
    <div className="context-banner">
      <Space size={12} wrap>
        <Tag color="blue">当前用户</Tag>
        <Typography.Text>{preset?.label ?? demoUserId}</Typography.Text>
        {preset ? <Tag>{preset.role}</Tag> : <Tag color="default">自定义</Tag>}
        <Typography.Text type="secondary">
          {preset?.department ?? "自定义用户"}
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
        title={`${item.label}暂不可用`}
        description="当前账号暂不能访问该功能，请联系系统管理员确认权限或功能开通状态。"
        step={item.label}
      />
      <PermissionHint description="系统已按当前账号权限展示可访问的数据和操作。" />
    </Space>
  );
}
