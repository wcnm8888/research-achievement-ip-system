import { Alert, Card, Space, Tag, Typography } from "antd";
import { BoundaryNotice, PermissionHint, SectionHeader } from "./components/StateBlocks";

export type SettingsCapability = {
  key: string;
  title: string;
  designGoal: string;
  currentSignal: string;
  missingContract: string;
  futureConfirmation: string;
};

export type SettingsBoundary = {
  title: string;
  apiStatus: "none";
  permissionSignal: string;
  requestPolicy: "NO_BUSINESS_API_REQUEST";
  unavailableActions: string[];
  excludedRoutes: string[];
};

export const settingsCapabilities: SettingsCapability[] = [
  {
    key: "roles-permissions",
    title: "角色权限",
    designGoal: "系统管理员配置角色、权限范围和授权策略，支撑部门隔离与涉密访问控制。",
    currentSignal: "当前已通过业务页面体现角色权限和部门范围控制。",
    missingContract: "角色权限维护入口暂未开放。",
    futureConfirmation: "角色权限初始化、授权变更审计和批量维护需要后续单独开放。",
  },
  {
    key: "departments",
    title: "部门",
    designGoal: "维护研究院组织结构，用于成果、费用、审批、看板和审计的部门范围判断。",
    currentSignal: "现有业务数据中已有部门范围概念。",
    missingContract: "部门配置列表、详情、启停和层级维护请进入部门维护页面处理。",
    futureConfirmation: "部门维护会影响权限和历史数据展示，需要在专门页面执行。",
  },
  {
    key: "dictionaries",
    title: "字典",
    designGoal: "统一成果类型、状态、费用类型、密级、提醒级别等枚举展示和业务口径。",
    currentSignal: "当前已内置多组固定枚举和展示映射。",
    missingContract: "可配置字典维护入口暂未开放。",
    futureConfirmation: "动态字典、兼容旧数据、枚举迁移和审计记录需要单独确认。",
  },
  {
    key: "reminder-rules",
    title: "预警规则",
    designGoal: "配置专利/软著费用 30/15/7 天及逾期提醒规则和站内通知策略。",
    currentSignal: "费用页和看板已展示预警摘要。",
    missingContract: "独立预警规则配置入口暂未开放。",
    futureConfirmation: "规则编辑、提醒任务生成、通知发送和数据回填需要后续单独开放。",
  },
  {
    key: "interface-adapters",
    title: "外部接口适配",
    designGoal: "为 DOI、邮件、HR/SSO、财务、专利状态、对象存储等外部能力预留替换点。",
    currentSignal: "外部接口能力已作为独立配置入口管理。",
    missingContract: "本页面只展示配置入口，不展示环境配置、密钥、令牌或完整连接串。",
    futureConfirmation: "SSO、对象存储、检索引擎、邮件和财务联调需要后续单独确认。",
  },
];

export const getStep20BSettingsBoundary = (): SettingsBoundary => ({
  title: "系统配置能力概览",
  apiStatus: "none",
  permissionSignal: "系统配置权限用于控制配置入口可见性。",
  requestPolicy: "NO_BUSINESS_API_REQUEST",
  unavailableActions: [
    "创建",
    "编辑",
    "删除",
    "保存",
    "同步",
    "导入",
    "导出",
    "下载",
  ],
  excludedRoutes: [
    "系统配置维护入口",
    "角色/部门/字典/预警规则维护",
    "附件上传、下载和详情取回",
    "费用凭证附件",
    "预警规则写入",
    "检索日志写入",
    "外部搜索引擎同步",
    "种子数据、迁移或数据清理",
  ],
});

export const getSettingsBoundaryForDemoUser = (
  demoUserId: string | null,
): SettingsBoundary => {
  void demoUserId;
  return getStep20BSettingsBoundary();
};

export function SettingsBoundary({ demoUserId }: { demoUserId: string | null }) {
  const boundary = getSettingsBoundaryForDemoUser(demoUserId);

  return (
    <Space direction="vertical" size={16} className="page-stack settings-boundary-page">
      <SectionHeader
        title={boundary.title}
        description="展示当前可用配置入口和后续可扩展能力。"
        extra={
          <Space size={8} wrap>
            <Tag color="gold">配置概览</Tag>
            <Tag color="default">权限控制</Tag>
          </Space>
        }
      />

      <PermissionHint description="当前账号可查看已开放的系统配置入口。" />

      <Alert
        className="settings-boundary-alert"
        type="info"
        showIcon
        message="配置功能说明"
        description="本页用于查看已开放的配置入口，暂不提供配置导入、导出或下载。"
      />

      <div className="settings-capability-grid">
        {settingsCapabilities.map((capability) => (
          <SettingsCapabilityCard capability={capability} key={capability.key} />
        ))}
      </div>

      <Card className="shell-card settings-boundary-card" title="暂未开放">
        <div className="settings-boundary-list">
          {boundary.excludedRoutes.map((route) => (
            <Tag color="default" key={route}>
              {route}
            </Tag>
          ))}
        </div>
      </Card>

      <BoundaryNotice
        title="后续配置维护"
        description="角色权限、字典、预警规则和接口适配器的维护能力需要后续单独开放。"
        step="系统配置"
      />
    </Space>
  );
}

function SettingsCapabilityCard({ capability }: { capability: SettingsCapability }) {
  return (
    <Card className="shell-card settings-capability-card" title={capability.title}>
      <Space direction="vertical" size={10}>
        <SettingsCapabilityLine label="设计目标" value={capability.designGoal} />
        <SettingsCapabilityLine label="当前状态" value={capability.currentSignal} />
        <SettingsCapabilityLine label="开放情况" value={capability.missingContract} />
        <SettingsCapabilityLine label="后续计划" value={capability.futureConfirmation} />
      </Space>
    </Card>
  );
}

function SettingsCapabilityLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-capability-line">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text>{value}</Typography.Text>
    </div>
  );
}
