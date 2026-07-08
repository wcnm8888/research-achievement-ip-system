# Step182 - 运维与兼容性验收差距收口

日期：2026-07-08

当前 HEAD：`6b9daece42fe469d23ff3a58a0ba073dac469989`

项目定位必须保持为：

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本文只做 7.5 运维与兼容性验收差距收口，不执行生产操作，不接入真实监控平台，不跑真实多浏览器 / 多操作系统 / 多设备矩阵。本文不能表述为真实生产上线完成版、真实外部系统联调完成版、VPS / 生产 DB 验收完成版。

## 本次收口结论

当前一期本地评审提交版已经具备可演示的系统配置、接口管理、审计日志查询、导入历史 / 运维视图、本地备份恢复静态证据、接口运维 runbook、页面错误态稳定性，以及本地健康摘要 / SLA 摘要 / 接口告警摘要口径。

当前仍不能宣称完成生产级运维与正式兼容性验收。完整动态字典维护、生产监控告警系统、灾备自动化、多浏览器 / 多操作系统 / 多设备正式验收、生产运维 / 部署 / 回滚手册完整落地和生产回滚演练，均应作为二期 / 生产化专项推进。

## 已可演示 / 可验收的运维能力

| 能力 | 当前状态 | 证据 / 索引 | 演示口径 | 禁止夸大 |
| --- | --- | --- | --- | --- |
| 系统配置 | 已可演示 | `apps/web/src/SettingsBoundary.tsx`、`apps/api/src/settings/*`、Step180 7.5 | 可展示系统配置入口、配置类管理边界和 `system:config` 权限控制 | 不说生产配置中心、生产审批流和密钥托管已完成 |
| 接口管理 | 已可演示 | `apps/web/src/SettingsApiIntegrations.tsx`、`apps/api/src/settings/api-integration-settings.*`、`prisma/schema.prisma` `ApiIntegration` / `ApiCallLog`、Step179 runbook | 可展示接口列表、provider、enabled、`timeoutMs`、`configRef`、归档 / 恢复、Mock 预演和安全调用日志摘要 | 不说真实 DOI / 邮件 / HR / 财务 / 专利 / 对象存储已经生产联调 |
| 审计日志查询 | 已可演示 | `apps/web/src/AuditLogs.tsx`、`apps/api/src/audit/*`、Step177 / Step180 | 可展示脱敏只读查询、筛选、导出事件摘要和 masked CSV 导出能力 | 不说生产审计归档、防篡改、长期留存和合规销毁已完成 |
| 导入历史 / 运维视图 | 部分可验收 / 可演示 | `apps/web/src/SettingsImportJobHistoryOverview.tsx`、`apps/web/src/ImportJobHistoryPanel.tsx`、`apps/api/src/imports/import-job-history-read.*` | 可展示导入任务概览、状态、详情和安全行级历史视图 | 不说完整生产运维平台、生产失败重放和生产补偿队列已完成 |
| 本地备份 / 恢复静态证据 | 已形成本地证据 | Step178、`deploy/local-backup-artifact-list.*`、`apps/api/src/operations/attachment-binary-backup.*` | 可说明已有本地 PostgreSQL 手动备份历史证据、manifest、SHA-256、artifact-list validator、附件备份 manifest / digest 测试和恢复 dry-run 边界 | 不说生产每日自动备份、30 天留存、异地备份、真实恢复演练、RTO/RPO 已完成 |
| 接口运维 runbook | 已补强 | `memory-bank/api-integration-operations-runbook-step179.md`、`memory-bank/api-integration-production-readiness-checklist-step179.md`、`memory-bank/api-integration-demo-qa-card-step179.md` | 可说明接口预留、Mock 预演、降级、`alertSummary` 口径、`ApiCallLog` 安全摘要和生产接入前 checklist | 不把 checklist 说成已经执行完成 |
| 页面错误态稳定性 | 已增强演示稳定性 | Step176 smoke、Step173 / Step180 摘要 | 可说明登录页、SPA fallback、未认证 API 错误形态和页面工程错误文案已做收口 | 不说所有未知生产异常都已覆盖 |
| 健康摘要 / SLA 摘要 / 接口告警摘要 | 本地摘要口径可说明 | `apps/api/src/health.controller.ts`、`docker-compose.production.yml` healthcheck、`memory-bank/reminder-sla-monitoring-step162.md`、Step179 | 可说明 `/api/health`、Docker healthcheck、提醒 SLA 健康摘要、接口 `alertSummary` 演示口径 | 不把这些说成真实生产监控告警平台 |

## 当前部分完成的能力

| 能力 | 当前状态 | 可说内容 | 不可说内容 |
| --- | --- | --- | --- |
| 字典维护 / 元数据配置 | 部分完成 | 系统中已有枚举、状态标签、配置引用、接口 provider、附件 metadata、导入状态等局部元数据和配置能力 | 完整动态字典中心、业务字典在线维护、字典版本治理、字典发布审批已完成 |
| 移动端核心 UI | 基础适配 / 历史检查 | `apps/web/src/App.tsx` 有移动端主导航和响应式 Sider，`apps/web/src/App.css` 有 960px / 640px 媒体查询、网格折叠、抽屉和表格横向滚动，Step167 曾做移动端核心 UI 检查 | 全机型、全分辨率、真实移动浏览器正式验收完成 |
| 浏览器 / 操作系统兼容基础 | 基础浏览器 smoke 和响应式实现 | Step176 做过本地浏览器入口、SPA fallback、登录页和未认证错误态 read-only smoke；前端组件普遍使用 Ant Design 和响应式布局 | Chrome / Edge / Firefox / Safari 多版本、多 OS 正式矩阵验收完成 |
| 灾备 runbook / 恢复 dry-run | 文档和静态证据为主 | Step178 纳入本地备份、manifest、SHA-256、artifact-list 和恢复 dry-run 计划边界 | 灾备自动化、生产恢复演练、异地恢复、RTO/RPO 验收完成 |
| 运维 / 部署 / 回滚文档 | 部分 runbook 和 checklist 已存在 | `deploy/runbook-production.md`、`deploy/runbook-demo.md`、`deploy/checklist-production-cutover.md`、Step175 / Step178 / Step179 可作为本地评审和后续生产化准备参考 | 生产运维手册、部署手册、回滚手册已经完整落地并完成演练 |

## 当前不能宣称完成的内容

- 完整动态字典维护：没有完整动态字典中心、在线字典治理、版本发布、审批和全业务字典联动验收。
- 生产监控告警系统：没有接入真实 Prometheus / Grafana / 云监控 / 告警平台，也没有真实告警渠道和值班升级验收。
- 灾备自动化：没有生产每日自动备份、异地备份、自动加密上传、失败重试、恢复自动化和 RTO/RPO 达标证据。
- 多浏览器 / 多操作系统 / 多设备正式验收：没有覆盖 Chrome / Edge / Firefox / Safari、多 OS、多移动设备的正式矩阵和签字记录。
- 生产运维手册完整落地：当前是本地 runbook、接口 runbook、备份静态证据和 checklist，不是完整生产运行手册。
- 生产部署手册完整落地：已有部署相关文档可作为参考，但没有在本 Step 执行生产部署或形成新生产验收证据。
- 生产回滚演练完成：没有执行生产回滚、数据恢复、灰度切换或真实外部系统切流演练。

## 二期 / 生产化增强建议

1. 动态字典中心：建设统一字典表、字典项版本、启停状态、引用关系检查、发布审批、审计和回滚机制。
2. 生产监控指标和告警规则：补齐 API 可用性、错误率、延迟分位数、数据库连接、队列积压、接口 provider 成功率 / 失败率 / 超时率、SLA 扫描健康和备份任务状态。
3. 日志聚合与审计归档：接入集中日志，明确审计日志脱敏、检索、归档、防篡改、留存周期和合规销毁要求。
4. 备份调度和恢复演练：实现 DB + 附件完整备份集、加密、异地留存、定时调度、失败告警、恢复 drill 和 RTO/RPO 验收。
5. 多浏览器 / 多设备验收矩阵：建立浏览器版本、OS、移动设备、分辨率、核心业务路径、截图 / 录像 / 缺陷闭环和验收签字矩阵。
6. 部署、回滚、巡检、值班手册：补齐生产部署 SOP、发布前检查、发布后巡检、回滚条件、回滚步骤、值班表、升级路径和红线操作。
7. 事故响应流程：定义 P0-P3 分级、响应时限、沟通模板、根因分析、复盘、数据修复审批和证据留存。

## 明天演示问答口径

### 有没有系统配置和接口管理？

有。当前本地评审版已经可以展示系统配置 / 接口管理页面，覆盖接口 provider、启停状态、超时、配置引用、Mock 预演、降级路径、归档 / 恢复和安全调用日志摘要。需要说明的是，这些是本地评审和生产接入前能力，不代表真实供应商、生产密钥托管和生产配置中心已全部完成。

### 日志能不能查？

能查。当前可展示脱敏审计日志查询、筛选、导出事件摘要和 masked CSV 导出能力，也可展示接口安全调用日志摘要。需要避免宣称生产审计归档、防篡改、长期留存、合规销毁已经完成。

### 有没有备份恢复？

有本地备份 / 恢复静态证据和恢复 dry-run 计划。可以说明已有本地 PostgreSQL 手动备份历史证据、manifest、SHA-256、artifact-list validator，以及附件备份 manifest / digest / artifact-list 单元测试证据。不能说生产每日自动备份、异地备份、真实恢复演练、RTO/RPO 已完成。

### 有没有生产监控告警？

没有完成真实生产监控告警系统。当前只有本地 `/api/health`、Docker healthcheck、SLA 健康摘要和接口 `alertSummary` 演示口径。可以说生产监控指标、告警平台、告警渠道、值班升级和演练是二期 / 生产化待接入。

### 移动端和浏览器兼容怎么样？

核心 UI 已有基础响应式适配，历史上做过移动端核心 UI 检查，本地浏览器 smoke 也验证过入口、SPA fallback、登录页和受保护 API 错误态。但不能说已经完成多浏览器、多 OS、多设备正式验收。正式验收仍需要专项矩阵。

### 上线后怎么运维和回滚？

当前已有本地演示 runbook、接口运维 runbook、生产接入前 checklist、备份恢复静态证据和部分部署 / 回滚参考文档。上线后的真实运维需要在生产化阶段补齐部署 SOP、回滚 SOP、巡检和值班手册、监控告警、备份调度、恢复演练和事故响应流程；不能把本地 runbook 说成生产演练已完成。

## 安全边界

- 不把本地 runbook、checklist、静态证据说成生产演练完成。
- 不把 `/api/health`、Docker healthcheck、SLA 健康摘要或接口 `alertSummary` 说成生产监控平台。
- 不把移动端历史检查和响应式代码说成全设备正式验收。
- 不把本地备份历史证据和恢复 dry-run 计划说成生产灾备自动化完成。
- 不读取 `.env`、`.env.production`、密钥、Cookie、Token、生产连接串、真实监控平台配置或真实备份文件内容。
- 不访问 production / VPS / 生产 DB、真实监控平台、真实对象存储、真实外部告警系统或真实外部接口。
- 不执行生产部署、生产回滚、生产备份 / 恢复、真实监控告警配置、多浏览器云测、数据库迁移、数据库清空 / 覆盖 / 重置、文件删除、`git reset`、`git restore`、`git clean`、Docker prune 或 volume prune。

## 本 Step 验证口径

本 Step 是文档收口，不跑 API / Web 测试。验证仅限：

- `git diff --check`
- `git diff --cached --check`
