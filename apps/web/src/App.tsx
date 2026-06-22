import { Button, Input, Layout, Menu, Select, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { appName } from "./app-meta";
import "./App.css";
import { Achievements } from "./Achievements";
import { AuditLogs } from "./AuditLogs";
import { BoundaryNotice, PermissionHint, SectionHeader } from "./components/StateBlocks";
import {
  demoUserPresets,
  findDemoUserPreset,
  readStoredDemoUserId,
  storeDemoUserId,
} from "./demo-users";
import { Dashboard } from "./Dashboard";
import { Fees } from "./Fees";
import { Search } from "./Search";
import { SettingsBoundary } from "./SettingsBoundary";
import { Workbench } from "./Workbench";
import { WorkflowTasks } from "./WorkflowTasks";

const { Header, Sider, Content } = Layout;

type NavItem = {
  key: string;
  label: string;
  step: string;
  description: string;
};

const navItems: NavItem[] = [
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
    step: "Step 20B",
    description: "Step 20B 提供系统配置边界 / 只读能力盘点，不实现 settings/config API 或配置 CRUD。",
  },
];

const fallbackNavItem = navItems[0] as NavItem;

export function App() {
  const [activeKey, setActiveKey] = useState("workbench");
  const [demoUserId, setDemoUserId] = useState<string | null>(() => readStoredDemoUserId());
  const [customUserId, setCustomUserId] = useState("");
  const activeUser = useMemo(() => findDemoUserPreset(demoUserId), [demoUserId]);

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
            items={navItems.map((item) => ({
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
            <SettingsBoundary demoUserId={demoUserId} />
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
