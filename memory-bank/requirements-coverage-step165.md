# Step165 - 需求覆盖矩阵更新与剩余缺口复盘

日期：2026-07-08

## 结论

当前项目可以定义为：**local-demo / local Docker production-like 的科研成果与知识产权管理系统交付基线**。它已经覆盖一批一期核心业务闭环，并在 Step150-Step164 进一步补齐了导出、附件在线预览、提醒/SLA 治理、扫描队列、执行记录、指标看板、健康检查和上线前只读验收清单。

当前仍不能定义为：**真实生产上线完成、VPS/生产 DB 验收完成、真实外部系统联调完成、正式运维监控完成或完整二期全部交付完成**。

最关键的剩余缺口集中在：

- 真实外部系统：HR/SSO、财务、邮件/短信/企微、DOI/文献库、专利状态平台均未真实联调。
- 生产化运行：scheduler 默认关闭，SLA worker 仍是应用内 MVP，无外部 worker 运行策略和生产监控平台接入。
- 高级能力：完整 BI、定时报表推送、移动端、真实对象存储、附件加密/水印/Office 预览、灾备演练和十万级压测仍未完成。
- 生产验收：未访问 production / VPS / 生产 DB，未执行生产 migration、备份恢复、真实权限账号验收。

## 本次依据

- 需求说明：`研究院科研成果管理系统说明.html`
- 旧覆盖矩阵：
  - `memory-bank/project-requirement-completion-matrix.md`
  - `memory-bank/project-requirement-completion-matrix-client-facing-step135.md`
- Step150-Step164 验收文档：
  - `memory-bank/export-mvp-step150.md`
  - `memory-bank/export-mvp-step151.md`
  - `memory-bank/export-governance-step152.md`
  - `memory-bank/attachment-preview-step153.md`
  - `memory-bank/reminder-followup-step154.md`
  - `memory-bank/reminder-governance-step155.md`
  - `memory-bank/reminder-sla-step156.md`
  - `memory-bank/reminder-sla-scan-step157.md`
  - `memory-bank/reminder-sla-persistence-step158.md`
  - `memory-bank/reminder-sla-async-scheduler-step159.md`
  - `memory-bank/reminder-sla-metrics-step161.md`
  - `memory-bank/reminder-sla-monitoring-step162.md`
  - `memory-bank/reminder-sla-production-readiness-step164.md`
- 当前提交基线：`409e9d2 feat: add reminder sla monitoring dashboard`
- 当前未提交文档：`memory-bank/reminder-sla-production-readiness-step164.md`

## 状态定义

- **已完成**：在 local-demo / local Docker production-like 范围内已有 API、Web 入口、测试或验收文档闭环。
- **部分完成**：已有主路径或 MVP，但还缺正式生产能力、外部联调、完整配置化或高级分支。
- **未完成**：当前仓库没有可验收实现，或只有规划/预留/mock。
- **不在当前 MVP**：需求存在，但已明确作为后续二期、生产化或独立专项处理。
- **生产待验收**：代码/文档存在，但未授权访问生产环境、未执行生产迁移或未做真实生产验收。

## 需求覆盖矩阵

| 需求域 | 需求说明中的要求 | 当前覆盖状态 | 已有证据 | 主要缺口 |
| --- | --- | --- | --- | --- |
| 成果登记：论文/专利/软著 | 三类成果统一登记、详情字段、状态流转、归档 | 已完成 | `apps/api/src/achievements`、`Achievements.tsx`、导入 apply、旧矩阵记录 | DOI 自动补全、专利官方状态同步、真实外部登记材料流转未联调 |
| 成果唯一性校验 | DOI、申请号、登记号等唯一性校验 | 已完成 | normalized business key、导入冲突检测 | 跨来源合并、人工冲突确认工作台仍可增强 |
| 成果审批流 | 科研人员提交、部门初审、管理员归档 | 已完成 | workflow API/Web、待办与审批记录 | 可视化流程设计器、会签、加签、转办未完成 |
| 成果注销/作废 | 失效、撤回、作废标记和原因留存 | 部分完成 | achievement 状态机、void/archive 相关路径 | 作废原因治理、批量归档、长期归档策略仍可增强 |
| 涉密成果管控 | 涉密权限隔离、授权访问、附件受控 | 部分完成 | RBAC、secret authorization safe summary、附件权限策略 | 涉密授权 mutation、批量授权、涉密附件加密和生产验收未完成 |
| 附件管理 | 附件版本、权限、下载、在线预览、加密存储 | 部分完成 | Step153：PDF/PNG/JPEG 在线预览；附件下载权限和审计 | Office/HTML/SVG/音视频预览、水印、真实对象存储、加密落地、清理补偿未完成 |
| 成果转化 | 技术转让、许可、作价入股、合同/收款/收益分配/后评估 | 部分完成 | conversion MVP、conversion deepening MVP、Dashboard 入口 | 真实合同、法务、付款、发票、结算、财务联调和完整后评估未完成 |
| 费用台账 | 专利/软著费用记录、金额、期限、凭证、状态 | 已完成 | `apps/api/src/fees`、`Fees.tsx`、凭证附件 | 真实付款、发票、对账和财务系统联调未完成 |
| 费用线上审批 | 部门审核、财务审批、支付、凭证归档 | 部分完成 | 费用 review path、本地演示闭环 | 真实财务支付、付款回执、批量缴费单未完成 |
| 批量费用操作 | 批量生成缴费单、批量标记缴费、欠费追踪 | 部分完成 | 费用台账、导入和提醒基础 | 完整批量缴费单、批量支付、真实欠费追踪专项未完成 |
| 费用预警与催办 | 30/15/7 天和逾期提醒、二次催办、部门负责人告知 | 已完成但有生产 caveat | Step154-Step159：提醒中心、频控、升级、SLA 策略、队列、扫描 | 真实邮件/短信/企微未接；生产 scheduler/worker 运行策略未定 |
| 提醒中心 | 查看提醒、确认回执、催办闭环 | 已完成 | `GET /reminders/center`、`POST /reminders/:id/confirm`、`POST /reminders/:id/escalate`、`Reminders.tsx` | 外部通知通道未接 |
| 提醒治理 | 频率限制、升级策略、升级历史 | 已完成 | Step155-Step156：24 小时频控、部门角色解析、升级历史 | 自定义提醒模板、用户订阅策略、持久化催办次数可增强 |
| SLA 策略与扫描 | 策略配置、定时扫描、多级升级链路 | 已完成但有生产 caveat | Step157-Step159：策略、持久化、全量扫描、队列、锁、幂等 | scheduler 默认关闭；外部 worker、生产 cron、真实告警渠道未完成 |
| SLA 监控 | 运维监控、运行指标、异常告警 | 部分完成 | Step161-Step162：metrics/health API、前端看板、告警预案 | 无 Prometheus/OpenTelemetry、无长期趋势、无生产监控平台、无自动修复 stuck lock |
| 标准统计看板 | 年度趋势、类型分布、部门排行、费用汇总 | 已完成但有 caveat | Dashboard、旧矩阵记录 | 不是完整 BI，不支持任意钻取和生产数据监控 |
| 自定义报表 | 多维筛选、自定义展示字段、权限隔离 | 部分完成 | Custom Reports MVP、Step150/151/152 导出 | 用户保存模板、定时报表推送、敏感 drilldown、完整 BI 未完成 |
| 报表导出 | 报表/看板支持 Excel、PDF | 部分完成 | Step150-Step152：CSV、Excel、Custom Report PDF、字段配置、导出审计 | 看板完整图表 PDF、所有页面 PDF、异步大导出、定时推送未完成 |
| 审计日志 | 操作留痕、日志查询、导出 | 已完成但有 caveat | AuditLogs、Step150 audit CSV、Step152 export-events | raw audit JSON 不开放；生产保留 5 年策略和不可篡改证明未验收 |
| 全文检索 | 关键词、模糊、高亮、组合条件、权限过滤 | 部分完成 | Search API/Web、权限过滤基础 | 中文分词/高亮、高级组合检索、搜索日志、生产 Meilisearch 运维未完成 |
| 角色与权限 | RBAC、部门数据隔离、角色职责边界 | 已完成但有 caveat | authorization module、guarded APIs、部门 scope | 复杂组织继承、跨部门联合授权、生产身份验收未完成 |
| 用户/部门管理 | 用户、部门、角色维护 | 已完成但有 caveat | Account/Department management、account lifecycle | 真实 HR/SSO、生产 token 交付、真实邮件短信未完成 |
| 导入能力 | 成果、部门、用户导入预检、真实本地写入、历史记录 | 已完成 | ImportJob/ImportJobItem、本地 apply、行级安全历史 | retry/repair/rollback/delete/raw CSV/raw JSON/export 未支持 |
| 外部接口预留 | DOI、文献库、专利、HR/SSO、财务、邮件、短信 | 部分完成 | Settings API integrations、mock demo center、adapter 方向 | 均未真实联调；凭证、超时、重试、降级和监控需生产专项 |
| 移动端适配 | 手机浏览器/轻应用提醒查看、审批、成果查阅 | 未完成 | 无正式移动端验收记录 | 需要独立移动端/响应式验收专项 |
| 性能指标 | 搜索 <1s、页面 <2s、看板 <3s、50 并发 | 生产待验收 | 单元测试和本地演示通过 | 未做真实 50 并发、十万级数据、生产压测 |
| 备份与灾备 | 每日备份、保留 30 天、RTO/RPO | 未完成 | runbook/文档方向 | 未执行生产备份、恢复演练、灾备验收 |
| 生产部署 | 生产迁移、部署、监控、回滚 | 生产待验收 | 本地 Docker production-like、readiness 文档 | 未访问 production/VPS/生产 DB，未执行生产 migration |

## Step150-Step164 新增覆盖影响

| Step | 新增能力 | 覆盖的需求点 | 对状态的影响 |
| --- | --- | --- | --- |
| Step150 | CSV 导出 MVP | 报表、成果台账、费用台账、审计日志导出 | 将“导出能力”从未完成提升为部分完成 |
| Step151 | Excel/PDF 导出增强 MVP | Excel、Custom Report PDF | 覆盖 Excel 基础导出；PDF 仍限自定义报表文本预览 |
| Step152 | 导出治理与字段配置 | 字段选择、导出审计看板 | 增强导出安全治理；用户保存模板仍未完成 |
| Step153 | 附件在线预览 MVP | 成果附件、费用凭证附件在线预览 | 附件预览从未完成提升为部分完成 |
| Step154 | 提醒中心与站内催办 | 提醒查看、确认、站内催办 | 提醒闭环主路径完成 |
| Step155 | 提醒治理与升级策略 | 频控、逾期升级 fallback | 补齐避免无限催办的治理能力 |
| Step156 | 正式升级接收人解析、SLA 队列/历史 | 部门角色解析、升级历史 | 从 fallback 推进到正式部门角色解析 MVP |
| Step157 | SLA 定时扫描任务、策略、多级升级 | SLA 策略与多级升级链路 | SLA 从手工操作推进到可扫描策略 |
| Step158 | SLA 策略持久化、全量扫描、执行记录 | 策略配置、全量扫描、执行记录 | 管理员级 SLA 治理形成数据库记录 |
| Step159 | 异步队列、定时触发、并发锁/幂等 | 队列、锁、幂等、scheduler enqueue | 具备 production-like 队列治理雏形 |
| Step160 | 收口 Review 与统一提交 | 提醒/SLA 线审查 | 修复 claim 并发风险并统一入库 |
| Step161 | SLA 扫描运行指标看板 | 运行指标、队列积压、成功率 | 增加管理员可见的运行指标 |
| Step162 | 生产化监控与告警预案 MVP | 健康状态、告警原因、推荐动作 | 增加只读健康检查和告警预案 |
| Step163 | Step161/162 统一提交 | 指标/健康检查收口 | 已提交 `409e9d2` |
| Step164 | 生产部署前只读验收清单 | 上线前 API/前端/权限/配置检查 | 形成提醒/SLA 生产前只读验收材料，未提交 |

## 当前剩余工作优先级

### P0：建议下一阶段优先处理

1. **Step164 文档收口提交**
   - 当前 `memory-bank/reminder-sla-production-readiness-step164.md` 未提交。
   - 建议与 Step165 文档一起做一次 docs-only 提交。

2. **最终交付口径冻结**
   - 明确对外只声明 local-demo / local Docker production-like。
   - 不把 mock、adapter、synthetic、readiness 文档说成真实生产联调。

3. **生产前只读总验收清单**
   - 将提醒/SLA 的 Step164 扩展到全系统：成果、费用、附件、导出、导入、权限、审计、搜索、报表、账号、配置。
   - 不访问生产，只列出 go/no-go 条件。

4. **未跟踪本地产物审计计划**
   - 当前仍存在 `.local-step*`、`.learnings`、`apps/api/deploy`、`local-prod-preview-proxy.cjs` 等未跟踪项。
   - 不建议直接删除；应单独做只读归类和保留/归档建议。

### P1：上线增强能力

1. **外部通知 adapter 预案**
   - 邮件/短信/企微先做 mockable adapter 和配置边界，不接真实凭证。
   - 需要明确失败重试、降级、审计和敏感字段保护。

2. **导出能力增强**
   - 异步大导出任务、下载历史、用户保存字段模板。
   - 报表 PDF 图表化、分页、中文字体和打印级样式。

3. **附件能力增强**
   - Office 转换预览队列、PDF 水印、预览访问过期策略。
   - 真实对象存储 readiness 和加密/保留策略。

4. **自定义报表增强**
   - 保存模板、定时推送、部门/个人模板隔离。
   - 仍需保持 sensitive drilldown 边界。

5. **搜索增强**
   - 高级组合检索、中文分词/高亮、搜索日志和热门词统计。

### P2：生产化和真实集成专项

1. **真实 HR/SSO 集成**
   - 需要测试环境、凭证授权、脱敏日志、回滚策略。

2. **真实财务集成**
   - 付款、发票、凭证、对账、批量缴费单。

3. **真实 DOI/文献库/专利状态集成**
   - 多源优先级、限流、异步队列、失败降级。

4. **生产监控平台**
   - Prometheus/OpenTelemetry、告警路由、仪表盘、容量趋势。

5. **生产部署与灾备**
   - 生产 migration、备份恢复演练、RTO/RPO 验收、压测。

6. **移动端**
   - 手机浏览器或轻应用的提醒、审批、成果查阅核心流程。

## 推荐 Step166+ 路线

### 推荐路线 A：文档与交付收口

- Step166：Step164-165 docs-only Review + 统一提交
- Step167：全系统生产前只读验收清单
- Step168：最终演示/交付边界说明稿

适合目标：准备对外验收、评审或交付说明。

### 推荐路线 B：上线增强

- Step166：外部通知 adapter 设计与 mockable provider MVP
- Step167：导出异步任务与下载历史 MVP
- Step168：附件预览治理增强 MVP

适合目标：继续增强用户可见能力，但仍不接真实外部系统。

### 推荐路线 C：生产 readiness

- Step166：生产部署 go/no-go 只读清单
- Step167：生产 migration/备份/回滚演练方案
- Step168：生产监控与告警接入方案

适合目标：用户明确授权进入生产准备，但在授权前仍不访问生产。

## 本次 Step165 安全边界

- 只新增需求覆盖复盘文档。
- 未修改源码、schema、migration。
- 未读取 `.env` / `.env.production` / 凭证 / Cookie / Token / 密码 / 连接串。
- 未访问 production / VPS / 生产 DB。
- 未调用真实 HR/SSO、邮件、短信、企微、财务、DOI、专利等外部系统。
- 未删除、移动、清理任何文件或目录。
- 未触碰既有 `.local-step*`、`.learnings`、`apps/api/deploy`、`local-prod-preview-proxy.cjs`。

## 验证记录

- `git diff --check`：通过。
- 文档尾随空白检查：通过，`Select-String -Path memory-bank\requirements-coverage-step165.md -Pattern '[ \t]+$'` 无命中。
