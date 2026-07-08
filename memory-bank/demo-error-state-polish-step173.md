# Step173 - 演示稳定性与错误态收口

## 目标

降低本地评审演示时暴露工程态错误文案的风险，优先覆盖：

- 提醒中心
- 自定义报表
- 审计日志
- 系统配置 / 接口预留
- 全文检索
- 成果登记 / DOI 自动补全预演入口

## 实现范围

- 新增 `apps/web/src/error-display.ts`：
  - 统一清洗用户可见错误标题和详情。
  - 将 `Cannot GET`、`/api/` 路径、raw/JSON/stack/endpoint、`mock-demo` 等工程态文本替换为中文降级说明。
  - 保留正常业务校验文案，例如筛选条件格式错误。
- `api-client`：
  - 对后端错误 `message` 做展示前清洗，避免 404 fallback 将 `Cannot GET /api/...` 传到页面。
- `DataState`：
  - 通用错误态标题和详情统一走演示安全文案。
- 优先页面：
  - 成果登记、接口设置、提醒中心、自定义报表、审计日志、全文检索的直接 Alert / 文案入口接入安全错误文案。
  - 全文检索结果数量标签由 `total` 改为中文“共 N 条”。
  - 系统配置 / 接口预留的场景不匹配提示改用中文供应商名。

## 验证

- `corepack pnpm --filter @research-ip/web test -- api-client error-display SettingsApiIntegrations AchievementForm Reminders CustomReports AuditLogs Search`: PASS, 8 files / 136 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.

## 边界

- 未读取 `.env` 或 `.env.production` 内容。
- 未访问 production/VPS/production DB。
- 未调用真实 DOI、Crossref、OpenAlex、Scopus、SMTP、短信、企微、HR/SSO、财务或专利平台。
- 未修改 API 服务、数据库 schema、迁移、seed、部署配置或生产配置。
- 未处理 PPT、截图、性能日志、备份文件或既有本地产物。
- 当前结论只证明本地评审演示错误态更稳定，不等同于生产验收完成。
