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
    designGoal: "系统管理员配置角色、权限边界和授权策略，支撑部门隔离与涉密访问控制。",
    currentSignal: "系统配置权限目前只是访问边界线索；已有业务页面仍以后端策略层做最终权限裁剪。",
    missingContract: "尚未确认 settings/config 只读 API，也没有角色权限 CRUD 后端契约。",
    futureConfirmation: "真实角色权限管理、permission seed、授权变更审计需要单独 Step 确认。",
  },
  {
    key: "departments",
    title: "部门",
    designGoal: "维护研究院组织结构，用于成果、费用、审批、看板和审计的部门范围判断。",
    currentSignal: "现有业务数据和演示用户中已有部门范围概念。",
    missingContract: "尚未提供部门配置列表、详情、启停或层级维护的 settings 后端契约。",
    futureConfirmation: "真实部门维护会影响权限和历史数据展示，需要独立设计和验收。",
  },
  {
    key: "dictionaries",
    title: "字典",
    designGoal: "统一成果类型、状态、费用类型、密级、提醒级别等枚举展示和业务口径。",
    currentSignal: "前后端已有多组固定枚举和展示映射，可支撑当前一期页面。",
    missingContract: "尚未提供可配置字典读取或写入 API，当前不是字典管理后台。",
    futureConfirmation: "动态字典、兼容旧数据、枚举迁移和审计记录需要单独确认。",
  },
  {
    key: "reminder-rules",
    title: "预警规则",
    designGoal: "配置专利/软著费用 30/15/7 天及逾期提醒规则和站内通知策略。",
    currentSignal: "费用页和看板已有前端派生预警展示，后端已有 reminder 概念。",
    missingContract: "尚未提供独立 warnings API 或预警规则配置 API。",
    futureConfirmation: "真实规则编辑、提醒任务生成、通知发送和数据回填必须拆成独立 Step。",
  },
  {
    key: "interface-adapters",
    title: "接口 adapter",
    designGoal: "为 DOI、邮件、HR/SSO、财务、专利状态、对象存储等外部能力预留替换点。",
    currentSignal: "一期文档要求通过 adapter 隔离外部依赖，并避免真实外部接口联调。",
    missingContract: "尚未提供接口配置读取 API；本页面不读取 env、密钥、Token 或完整连接串。",
    futureConfirmation: "真实 SSO、对象存储、Meilisearch、邮件/财务联调都需要用户显式确认。",
  },
];

export const getStep20BSettingsBoundary = (): SettingsBoundary => ({
  title: "系统配置边界 / 只读能力盘点",
  apiStatus: "none",
  permissionSignal: "系统配置权限只是访问边界信号，不代表已经提供完整配置 API。",
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
    "系统配置 API",
    "角色/部门/字典/预警规则/接口配置 CRUD",
    "附件上传、下载和详情取回",
    "费用凭证附件",
    "预警 API",
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
        description="展示系统配置能力边界和当前可用配置入口。"
        extra={
          <Space size={8} wrap>
            <Tag color="gold">配置边界</Tag>
            <Tag color="default">权限控制</Tag>
          </Space>
        }
      />

      <PermissionHint description="系统配置权限目前只是权限码或未来配置边界线索，不等于已完成配置管理后端 API；最终权限裁剪仍以后端策略层为准。" />

      <Alert
        className="settings-boundary-alert"
        type="info"
        showIcon
        message="当前不是配置管理实现"
        description="本页面不创建、不编辑、不删除、不保存、不同步、不导入、不导出、不下载配置；也不读取 .env、密钥、Token、Cookie、证书、私钥或完整连接串。"
      />

      <div className="settings-capability-grid">
        {settingsCapabilities.map((capability) => (
          <SettingsCapabilityCard capability={capability} key={capability.key} />
        ))}
      </div>

      <Card className="shell-card settings-boundary-card" title="本轮明确排除">
        <div className="settings-boundary-list">
          {boundary.excludedRoutes.map((route) => (
            <Tag color="default" key={route}>
              {route}
            </Tag>
          ))}
        </div>
      </Card>

      <BoundaryNotice
        title="真实配置管理需要后续单独计划确认"
        description="角色权限、部门、字典、预警规则、接口适配器的读取和写入契约都不能由本页面推断为已完成。"
        step="系统配置"
      />
    </Space>
  );
}

function SettingsCapabilityCard({ capability }: { capability: SettingsCapability }) {
  return (
    <Card className="shell-card settings-capability-card" title={capability.title}>
      <Space direction="vertical" size={10}>
        <SettingsCapabilityLine label="一期设计目标" value={capability.designGoal} />
        <SettingsCapabilityLine label="当前线索/边界" value={capability.currentSignal} />
        <SettingsCapabilityLine label="缺失契约" value={capability.missingContract} />
        <SettingsCapabilityLine label="后续确认" value={capability.futureConfirmation} />
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
