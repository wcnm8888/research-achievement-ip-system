# Step179 - 接口扩展与降级运维文档补强计划

## 定位

本计划服务于“研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like”。

本计划只确认接口扩展与降级运维文档的补强范围，不实现源码改动，不访问真实外部服务，不读取或记录真实凭证。当前结论不能表述为真实生产上线完成版、真实外部系统联调完成版、VPS/生产 DB 验收完成版。

## 本地一期可验证的接口能力

当前本地一期可验证能力是“接口预留 + Mock 预演 + 安全摘要日志 + 可降级演示”：

- 系统配置 / 接口预留页面可展示接口元数据、供应商类型、启用状态、超时配置、配置引用、归档/恢复状态和近期安全调用日志。
- Mock 预演中心支持 `DOI_LOOKUP`、`EMAIL_NOTIFICATION`、`PATENT_STATUS_SYNC`、`FINANCE_RECONCILE`、`HR_SYNC` 场景。
- Mock 预演结果支持 `SUCCESS`、`FAILURE`、`DEGRADED` 三种结果模式。
- 后端只写入 `ApiCallLog` 安全摘要：接口编码、请求编号、状态、耗时、错误摘要、创建时间。
- 成果登记页可从 DOI 字段触发“自动补全预演”，返回可人工确认的安全摘要，不自动覆盖用户已填内容。
- 邮件通知预演可展示接收范围、主题、摘要、通道状态、重试策略、超时和降级路径，并明确 `sendsExternalMessage=false`。
- 提醒中心当前实际通知能力仍是站内提醒 / Mock 通知路径，不是 SMTP、短信、企微或外部消息平台送达。

## DOI 自动补全预演能力边界

已具备：

- 从成果登记页 DOI 字段发起本地 Mock 预演。
- 请求携带当前 DOI 作为 `subject`，后端按 `DOI` provider + `DOI_LOOKUP` scenario 生成预演摘要。
- 成功预演返回题名、作者、期刊/会议、发表年份、引用摘要、字段映射建议等安全字段。
- 失败或降级时保留手工录入路径，不阻断成果登记。
- 预演结果只辅助人工录入，不写业务成果记录，不改写论文详情字段。

未具备：

- 未接入真实 DOI resolver、Crossref、OpenAlex、Scopus。
- 未保存真实外部请求/响应。
- 未做真实供应商限流、配额、重放、对账或服务 SLA 验收。
- 未建立生产监控、告警、审计留存和失败重放策略。

## 邮件通知预演能力边界

已具备：

- 系统配置 / 接口预留页面支持 `EMAIL_NOTIFICATION` Mock 预演。
- 成功预演展示接收范围、主题、摘要、通道状态、重试策略、超时、降级路径。
- 失败和降级预演可说明转站内提醒 / 人工跟进。
- 预演结果不发送外部邮件，不创建真实 SMTP / 第三方邮件服务请求。
- `AccountLifecycleMailer` 默认使用本地安全 stub delivery；账号生命周期相关页面显示模拟送达状态，不能作为真实邮件送达证据。

未具备：

- 未接入真实 SMTP、阿里云 DirectMail 生产发送、短信、企微或其他企业消息服务。
- 未验证真实退信、回执、退订、节流、供应商错误码、重复发送保护。
- 未配置生产密钥托管、供应商账号权限、真实告警通道或送达审计留存。

## HR / 财务 / 专利 / 存储等预留接口当前状态

当前状态是接口预留和 Mock 预演，不是真实外部系统联调：

| 领域 | 当前本地状态 | 可演示内容 | 未完成内容 |
| --- | --- | --- | --- |
| HR / SSO | `HR_SYNC` Mock 预演 | 人员变更摘要、人工账号维护降级说明、不会创建凭证或 SSO 会话 | 真实 HR、SSO、组织同步、生产身份生命周期 |
| 财务 | `FINANCE_RECONCILE` Mock 预演 | 回调 / 对账摘要、人工对账降级说明、不会创建付款/发票/凭证 | 真实财务系统、支付、发票、收据、凭证、回执对账 |
| 专利 | `PATENT_STATUS_SYNC` Mock 预演 | 专利状态同步预演、人工复核降级说明、不会同步官方专利数据 | 真实专利服务商、官方状态同步、年费节点对账 |
| 存储 | schema/provider 已预留 `STORAGE`，附件使用本地磁盘与本地备份证据 | 本地附件上传、元数据、权限下载、部分预览、本地备份静态证据 | 真实对象存储、预签名 URL、跨区备份、生产恢复演练 |
| 搜索 | schema/provider 已预留 `SEARCH` | 当前主要是数据库检索与本地页面闭环 | 外部搜索引擎、索引同步、失败重建、生产监控 |

## 已有配置项和可展示运维信号

已有配置项：

- provider：`DOI`、`EMAIL`、`HR`、`FINANCE`、`PATENT`、`STORAGE`、`SEARCH`、`OTHER`。
- enabled：接口开关。
- timeoutMs：默认 3000 ms，可作为超时策略展示字段。
- configRef：配置引用，只展示引用名，不展示密钥值。
- archive / restore：接口配置归档与恢复。
- mock result mode：成功、失败、降级。
- safe call log：`ApiCallLog` 记录接口编码、requestId、状态、耗时、错误摘要和创建时间。

已可展示但需要文档补强的运维信号：

- 重试策略：目前在邮件预演等安全结果中展示摘要，尚不是统一生产重试引擎。
- 告警摘要：页面和文档有告警口径，但尚未接入真实告警平台。
- 降级说明：DOI 失败转手工录入，邮件失败转站内提醒 / 人工跟进，HR/财务/专利转人工复核。
- 安全调用日志：当前是本地 Mock 预演安全摘要，不含原始请求、响应、Header、Token、Cookie、连接串或供应商凭证。

## 现有证据来源

- `memory-bank/api-integration-mock-acceptance-step172.md`
  - DOI 自动补全预演、邮件通知预演、接口治理、ApiCallLog 安全摘要和边界。
- `memory-bank/final-acceptance-coverage-step174.md`
  - 7.3 相关矩阵：Step172 DOI Mock、邮件 Mock、接口治理、生产待接入边界。
- `memory-bank/final-demo-runbook-step175.md`
  - 7 分钟演示路径、DOI / 邮件 Q&A、接口预留现场话术、失败降级口径。
- `memory-bank/final-demo-smoke-step176.md`
  - `/settings`、`/api/settings/api-integrations` 只读烟测和未访问真实服务边界。
- `apps/api/src/settings/dto/api-integration-settings.dto.ts`
  - Mock 场景、结果模式、调用日志 DTO、接口配置 DTO。
- `apps/api/src/settings/api-integration-settings.controller.ts`
  - `GET /settings/api-integrations`、`POST /settings/api-integrations/mock-demo/run`、`GET /settings/api-integrations/mock-demo/logs`。
- `apps/api/src/settings/api-integration-settings.service.ts`
  - Mock 预演服务、provider/scenario 校验、启用状态检查、安全摘要、ApiCallLog 写入。
- `apps/api/src/settings/api-integration-settings.repository.ts`
  - ApiIntegration 配置和 ApiCallLog 安全字段读写。
- `prisma/schema.prisma`
  - `ApiIntegrationProvider`、`ApiCallStatus`、`ApiIntegration`、`ApiCallLog` 模型。
- `apps/web/src/SettingsApiIntegrations.tsx`
  - 系统配置 / 接口预留页面、Mock 预演中心、近期安全调用日志。
- `apps/web/src/AchievementForm.tsx`
  - DOI 自动补全预演入口和手工录入降级文案。
- `apps/api/src/notifications/*`、`apps/api/src/reminders/*`
  - 站内通知、提醒发送和安全审计摘要，非真实外部邮件 / 短信发送。
- `apps/api/src/account-lifecycle/account-lifecycle-mailer.ts`
  - 默认本地安全 stub delivery，非真实生产邮件送达。

## 需要补强的文档项

建议下一步补强为运维可执行文档，而不是继续扩写源码能力：

1. 接口能力矩阵
   - 每个 provider 的当前状态、Mock 场景、可演示结果、降级路径、不可声明项。
2. DOI / 文献库接入 runbook
   - Crossref / OpenAlex / Scopus / DOI resolver 待接入清单、凭据托管要求、超时/限流/缓存/手工录入降级策略。
3. 邮件 / 消息接入 runbook
   - SMTP / 邮件服务 / 短信 / 企微的生产配置边界、送达失败处理、回执、退订、重复发送防护和人工跟进路径。
4. 供应商配置与密钥托管规范
   - 只记录 configRef、密钥管理职责、轮换流程、最小权限、禁止写入仓库和禁止展示规则。
5. 外部接口监控与告警策略
   - 指标、阈值、告警分级、值班责任、降级触发、恢复确认。
6. 失败重放和人工补偿策略
   - 哪些失败可重放、谁批准、幂等要求、审计记录、禁止自动重放的场景。
7. 审计留存策略
   - ApiCallLog 当前字段与生产扩展字段边界、脱敏要求、留存周期、归档和查询责任。
8. 现场演示 Q&A 卡片
   - DOI、邮件、HR/SSO、财务、专利、存储、告警和生产联调的允许说法 / 禁止说法。

## 推荐下一步 Step179-执行产出

建议 Step179-执行只产出文档，不改源码：

- `memory-bank/api-integration-operations-runbook-step179.md`
  - 面向运维 / 评审的接口扩展与降级运行手册。
- `memory-bank/api-integration-production-readiness-checklist-step179.md`
  - 生产待接入检查清单，覆盖密钥、供应商、SLA、监控、告警、审计、失败重放。
- `memory-bank/api-integration-demo-qa-card-step179.md`
  - 现场问答卡片，统一“本地一期可验证”和“二期/生产待接入”的话术。
- 更新 `memory-bank/progress.md` 和 `memory-bank/evidence.md`
  - 记录本次文档计划和下一步执行边界。

推荐 Step179-执行允许的验证：

- `git status --short --branch`
- 只读 `rg` 索引接口相关文件和文档。
- `git diff --check`
- `git diff --cached --check`

不建议 Step179-执行运行完整测试，除非未来文档链接或代码索引需要最小确认。

## 本计划不做的内容

- 不实现真实 DOI / Crossref / OpenAlex / Scopus 联调。
- 不实现真实 SMTP、邮件服务、短信、企微、HR、财务、专利服务商联调。
- 不新增生产密钥、供应商真实配置、真实告警平台配置。
- 不实现外部接口失败重放引擎或生产审计归档。
- 不修改 API / Web 源码、Prisma schema、migration、seed、部署配置或生产配置。
- 不运行数据库写入、迁移、Docker prune / volume prune、真实外部接口调用或真实消息发送。
- 不读取 `.env`、`.env.production`、Cookie、Token、私钥、API Key、生产连接串或供应商真实凭证。

## 二期 / 生产待接入内容

- 真实 DOI / Crossref / OpenAlex / Scopus 联调和验收。
- 真实 SMTP / 邮件服务 / 短信 / 企微联调和送达验收。
- HR / SSO 生产身份同步、账号生命周期、组织权限验收。
- 财务系统对账、支付/发票/收据/凭证回执和生产审计。
- 专利服务商状态同步、年费节点和官方数据一致性验收。
- 真实对象存储、预签名 URL、跨区备份和恢复演练。
- 生产密钥托管、供应商 SLA、限流、配额、监控告警、值班升级。
- 外部接口失败重放、人工补偿、审计留存、归档和合规查询。

## 安全边界

- 只使用本地仓库内已提交文档和源码索引作为证据。
- 不读取、复制、展示或保存任何密钥、Token、Cookie、密码、证书、私钥、连接串或真实供应商配置。
- 不访问 production / VPS / 生产 DB。
- 不访问真实 DOI、Crossref、OpenAlex、Scopus、SMTP、短信、企微、HR、财务、专利服务商或真实告警平台。
- 不把 Mock、预演、本地派生统计、安全摘要日志描述成真实外部系统联调完成。
- 后续文档如需描述生产接入，只能写成待接入 / 待验收 / 需单独授权的生产化工作。
