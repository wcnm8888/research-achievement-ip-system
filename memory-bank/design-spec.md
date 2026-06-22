# Design Spec - 一期基础刚需版

## 概述

- 功能：成果登记、基础审批流、RBAC 与部门隔离、费用台账与预警、基础全文检索、基础统计看板、审计日志、附件管理。
- 用户：科研人员、科研秘书、部门管理员、主管/院领导、涉密成果管理员、内审/审计人员、系统管理员。
- 目标：让一期系统能够替代基础 Excel 台账，完成从成果录入到审批归档、费用预警、查询统计和审计留痕的核心闭环。

## 用户故事

```text
作为科研人员，
我希望登记论文、专利或软著并提交审批，
以便成果信息被部门和院级统一归档管理。
```

```text
作为部门科研秘书，
我希望只看到本部门成果、审批待办和费用台账，
以便完成部门级审核和风险预警处理。
```

```text
作为系统管理员，
我希望配置角色、部门、字典、预警规则和接口 adapter，
以便系统可持续运维且不篡改业务数据。
```

```text
作为审计人员，
我希望只读查看成果、审批、附件和操作日志，
以便完成合规核查。
```

## 页面信息架构

- 登录页：账号登录，后续预留统一身份登录入口。
- 工作台：首页待办、费用预警、我的成果、部门概览、系统消息。
- 成果管理：成果列表、成果详情、论文登记、专利登记、软著登记、草稿、作废。
- 审批管理：我的待办、已办记录、审批详情。
- 费用管理：费用台账、预警列表、缴费记录、凭证附件。
- 检索中心：关键词搜索、筛选、结果列表、权限提示。
- 统计看板：年度趋势、类型分布、部门排行、专利状态、费用汇总。
- 审计日志：操作日志查询、对象详情、导出预留。
- 系统配置：角色权限、部门、字典、预警规则、接口配置。

## 用户流程

1. 登录：用户登录后加载角色、部门和权限集合。
2. 登记：用户选择成果类型，填写表单，上传附件，保存草稿或提交。
3. 校验：系统检查必填、格式、唯一性、权限和附件策略。
4. 审批：部门科研秘书处理本部门待办，系统管理员完成归档。
5. 费用：专利/软著可创建费用记录，系统根据截止日期生成预警。
6. 检索：用户输入关键词和筛选条件，系统返回权限范围内结果。
7. 看板：用户查看个人、部门或全院视角统计，后端按权限裁剪。
8. 审计：核心操作写入审计日志，审计人员只读查询。

## 数据模型

| 名称 | 字段 | 类型 | 说明 | 约束 |
| --- | --- | --- | --- | --- |
| users | id, name, email, dept_id, status | entity | 用户 | email 唯一，关联部门 |
| departments | id, name, parent_id, status | entity | 部门 | 支持层级 |
| roles | id, code, name | entity | 角色 | code 唯一 |
| permissions | id, code, name, resource, action | entity | 权限点 | code 唯一 |
| user_roles | user_id, role_id | relation | 用户角色 | 组合唯一 |
| achievements | id, type, title, status, secret_level, dept_id, owner_user_id, submitted_by, version, created_at, updated_at | aggregate root | 统一成果主表 | status 合法集合，dept_id 索引 |
| paper_details | achievement_id, doi, journal, issn_cn, publish_year, included_type, impact_factor, partition, abstract | detail | 论文详情 | doi 唯一，可为空但不允许重复非空 |
| patent_details | achievement_id, application_no, grant_no, patent_type, filing_date, grant_date, next_fee_date, fee_amount, legal_status | detail | 专利详情 | application_no 唯一，grant_no 唯一非空 |
| software_copyright_details | achievement_id, registration_no, version, software_type, publish_date, register_date, run_env | detail | 软著详情 | registration_no 唯一 |
| achievement_contributors | achievement_id, name, user_id, organization, contributor_type, role, sort_order | relation | 作者/发明人/著作权人 | achievement_id 索引 |
| workflow_instances | id, target_type, target_id, status, current_step | entity | 审批实例 | target 唯一活动实例 |
| workflow_tasks | id, instance_id, assignee_id, status, step_code | entity | 审批待办 | assignee_id/status 索引 |
| workflow_actions | id, instance_id, task_id, actor_id, action, comment, created_at | entity | 审批动作 | 不可删除 |
| fee_records | id, relation_type, relation_id, fee_type, fund_source, amount, due_date, paid_date, pay_status, voucher_no | entity | 费用台账 | due_date/pay_status 索引 |
| reminder_tasks | id, target_type, target_id, remind_date, remind_level, receiver_id, status, confirm_time | entity | 预警提醒 | receiver/status 索引 |
| notifications | id, receiver_id, channel, title, content, status, sent_at | entity | 通知 | 支持站内和邮件 mock |
| attachments | id, relation_type, relation_id, file_name, storage_key, version, upload_user, secret_level, checksum | entity | 附件元数据 | 不暴露真实路径 |
| audit_logs | id, user_id, operate_type, table_name, record_id, old_value, new_value, ip_address, operate_time | append-only | 审计日志 | 不提供删除入口 |
| api_integrations | id, code, provider, enabled, timeout_ms, config_ref | entity | 外部接口配置 | 敏感值只引用环境变量 |
| api_call_logs | id, integration_code, request_id, status, duration_ms, error_summary, created_at | entity | 接口调用日志 | 不记录密钥和完整敏感响应 |
| search_logs | id, user_id, keyword, filters, result_count, created_at | entity | 检索日志 | keyword 需脱敏审查 |

## Step 3A 数据库 Schema 边界最终版

### 一期包含实体

- 组织与账号：`users`、`user_credentials`、`departments`。
- 角色权限结构：`roles`、`permissions`、`role_permissions`、`user_roles`。
- 涉密授权结构：`resource_access_grants`，仅建数据结构，授权判断延后到 Step 4。
- 成果主数据：`achievements`、`paper_details`、`patent_details`、`software_copyright_details`、`achievement_contributors`。
- 基础审批：`workflow_instances`、`workflow_tasks`、`workflow_actions`。
- 费用与提醒：`fee_records`、`reminder_tasks`、`notifications`。
- 附件元数据：`attachments`。
- 审计与日志：`audit_logs`、`api_integrations`、`api_call_logs`、`search_logs`。

### 一期不包含实体

- 成果转化、转化合同、转化收益、收益分配、转化后评估。
- 完整财务线上审批、批量缴费单、财务对账明细。
- 引文分析、论文引用指标快照、外部文献库同步任务。
- 真实 HR/SSO 同步表、真实专利法律状态同步表、真实短信推送表。
- 自定义报表模板、定时报表订阅、复杂可视化配置。
- 移动端推送设备、运维监控、灾备演练和十万级压测专用数据结构。

### 实体分组

| 分组 | 表 | 目的 | Step 3 边界 |
| --- | --- | --- | --- |
| 组织账号 | `departments`、`users`、`user_credentials` | 本地账号、部门树和用户归属 | 只建结构，不实现登录 |
| RBAC 结构 | `roles`、`permissions`、`role_permissions`、`user_roles` | 角色、权限点和分配关系 | 只建结构，不实现鉴权 |
| 授权预留 | `resource_access_grants` | 涉密或特定资源授权 | 只建结构，不实现授权逻辑 |
| 成果主数据 | `achievements`、三类详情、`achievement_contributors` | 论文、专利、软著统一台账 | 建唯一约束、索引和状态字段 |
| 审批 | `workflow_instances`、`workflow_tasks`、`workflow_actions` | 固定基础审批流的数据基础 | 不实现状态机逻辑 |
| 费用提醒 | `fee_records`、`reminder_tasks`、`notifications` | 缴费台账、预警任务和站内通知 | 不实现队列和发送逻辑 |
| 附件 | `attachments` | 附件元数据、版本和权限预留 | 不接对象存储真实 API |
| 审计日志 | `audit_logs` | 核心操作留痕 | append-only 设计，不提供删除入口 |
| 外部接口日志 | `api_integrations`、`api_call_logs` | adapter 配置引用和调用摘要 | 不接真实外部 API |
| 检索日志 | `search_logs` | 基础检索行为记录 | 不实现 Meilisearch 同步 |

### 表设计清单

| 表 | 核心字段 | 唯一约束 | 索引 | 外键/关系 | 状态与时间字段 |
| --- | --- | --- | --- | --- | --- |
| `departments` | `id`, `code`, `name`, `parent_id` | `code` | `parent_id`, `status` | 自关联 `parent_id` | `status`, `created_at`, `updated_at`, `archived_at` |
| `users` | `id`, `email`, `name`, `department_id` | `email` | `department_id`, `status` | `department_id -> departments.id` | `status`, `created_at`, `updated_at`, `archived_at` |
| `user_credentials` | `id`, `user_id`, `password_hash`, `password_updated_at` | `user_id` | `user_id` | `user_id -> users.id` | `status`, `created_at`, `updated_at`, `disabled_at` |
| `roles` | `id`, `code`, `name`, `description` | `code` | `status` | - | `status`, `created_at`, `updated_at`, `archived_at` |
| `permissions` | `id`, `code`, `resource`, `action`, `name` | `code` | `resource`, `action` | - | `status`, `created_at`, `updated_at` |
| `role_permissions` | `role_id`, `permission_id` | `role_id + permission_id` | `permission_id` | FK to roles/permissions | `created_at` |
| `user_roles` | `user_id`, `role_id`, `scope_type`, `scope_key`, `department_id` | `user_id + role_id + scope_type + scope_key` | `user_id`, `role_id`, `department_id` | FK to users/roles/departments | `created_at`, `revoked_at` |
| `resource_access_grants` | `resource_type`, `resource_id`, `grantee_type`, `grantee_id`, `grant_type` | 待 3B 确认是否增加活动授权唯一键 | `resource_type + resource_id`, `grantee_type + grantee_id` | 应用层统一解释资源目标 | `status`, `starts_at`, `expires_at`, `created_at`, `revoked_at` |
| `achievements` | `type`, `title`, `status`, `secret_level`, `department_id`, `owner_user_id`, `submitted_by_id`, `version` | 待各详情表提供业务唯一键 | `department_id + status`, `owner_user_id + status`, `type + status`, `secret_level` | FK to departments/users | `status`, `created_at`, `updated_at`, `submitted_at`, `archived_at`, `voided_at` |
| `paper_details` | `achievement_id`, `doi`, `doi_normalized`, `journal`, `publish_year`, `abstract` | `achievement_id`, `doi_normalized` | `publish_year`, `journal` | `achievement_id -> achievements.id` | `created_at`, `updated_at` |
| `patent_details` | `achievement_id`, `application_no`, `application_no_normalized`, `grant_no`, `grant_no_normalized`, `legal_status`, `next_fee_date` | `achievement_id`, `application_no_normalized`, `grant_no_normalized` | `legal_status`, `next_fee_date` | `achievement_id -> achievements.id` | `created_at`, `updated_at` |
| `software_copyright_details` | `achievement_id`, `registration_no`, `registration_no_normalized`, `software_version`, `software_type` | `achievement_id`, `registration_no_normalized` | `software_type`, `register_date` | `achievement_id -> achievements.id` | `created_at`, `updated_at` |
| `achievement_contributors` | `achievement_id`, `name`, `user_id`, `organization`, `contributor_type`, `contributor_role`, `sort_order` | `achievement_id + contributor_type + sort_order` | `achievement_id`, `user_id` | FK to achievements/users | `created_at`, `updated_at` |
| `workflow_instances` | `target_type`, `target_id`, `status`, `current_step` | 活动实例唯一键待 3B 确认 | `target_type + target_id`, `status` | 应用层解释 target | `created_at`, `updated_at`, `completed_at`, `cancelled_at` |
| `workflow_tasks` | `instance_id`, `assignee_id`, `step_code`, `status` | 幂等唯一键待 3B 确认 | `assignee_id + status`, `instance_id + status` | FK to workflow_instances/users | `created_at`, `updated_at`, `claimed_at`, `completed_at` |
| `workflow_actions` | `instance_id`, `task_id`, `actor_id`, `action`, `comment` | - | `instance_id`, `actor_id`, `created_at` | FK to workflow_instances/tasks/users | `created_at` |
| `fee_records` | `achievement_id`, `fee_type`, `amount`, `due_date`, `paid_date`, `pay_status`, `voucher_no` | 可选 `achievement_id + fee_type + due_date` | `due_date + pay_status`, `achievement_id`, `department_id` | FK to achievements/departments/users | `pay_status`, `created_at`, `updated_at`, `archived_at` |
| `reminder_tasks` | `target_type`, `target_id`, `remind_date`, `remind_level`, `receiver_id`, `status` | `target_type + target_id + remind_date + remind_level + receiver_id` | `receiver_id + status`, `remind_date + status` | FK to users | `status`, `created_at`, `updated_at`, `sent_at`, `confirmed_at` |
| `notifications` | `receiver_id`, `channel`, `title`, `content`, `status` | - | `receiver_id + status`, `channel + status` | FK to users | `status`, `created_at`, `sent_at`, `read_at` |
| `attachments` | `relation_type`, `relation_id`, `file_name`, `storage_key`, `version`, `uploader_id`, `secret_level`, `checksum` | `relation_type + relation_id + file_name + version` | `relation_type + relation_id`, `uploader_id`, `secret_level` | FK to users，资源关系应用层解释 | `status`, `created_at`, `updated_at`, `archived_at` |
| `audit_logs` | `actor_user_id`, `actor_department_id`, `action`, `target_type`, `target_id`, `old_value`, `new_value`, `trace_id` | - | `actor_user_id`, `target_type + target_id`, `created_at`, `trace_id` | FK to users/departments 可为空保留历史 | `created_at` |
| `api_integrations` | `code`, `provider`, `enabled`, `timeout_ms`, `config_ref` | `code` | `enabled`, `provider` | - | `created_at`, `updated_at`, `archived_at` |
| `api_call_logs` | `integration_code`, `request_id`, `status`, `duration_ms`, `error_summary` | `request_id` | `integration_code + created_at`, `status` | 逻辑关联 `api_integrations.code` | `created_at` |
| `search_logs` | `user_id`, `keyword`, `filters`, `result_count` | - | `user_id + created_at`, `created_at` | FK to users | `created_at` |

### 命名规范

- 数据库表名和字段名使用 snake_case。
- Prisma Model 使用 PascalCase，字段使用 camelCase，通过 `@@map` 和 `@map` 映射数据库命名。
- 主键统一使用 `id`，Prisma 字段为 `id`，数据库字段为 `id`。
- 外键字段 Prisma 使用 `departmentId`、`ownerUserId`，数据库使用 `department_id`、`owner_user_id`。
- 枚举名使用 PascalCase，枚举值使用大写 snake case 或稳定业务码，3B 建模时统一。
- 业务唯一键使用 normalized 字段：`doi_normalized`、`application_no_normalized`、`grant_no_normalized`、`registration_no_normalized`。

### 软删除与归档策略

- 不硬删除业务数据；成果、附件、费用、角色、部门等使用 `status` 和 `archived_at` 表达停用、归档或隐藏。
- 成果作废使用 `voided_at`、`voided_by_id`、`void_reason`，不使用 `deleted_at`。
- 附件不删除对象存储真实文件路径信息，使用 `archived_at` 和 `status` 隐藏，并通过审计保留操作记录。
- 审批动作、审计日志、接口调用日志不提供软删除字段，按 append-only 处理。
- 真实合规销毁流程不在一期实现；如未来需要，必须单独设计并经过确认。

### 审计策略

- `audit_logs` 记录新增、修改、提交、审批、驳回、归档、作废、附件上传/下载、费用处理、提醒确认和配置变更。
- 审计字段包括操作者、操作者部门、目标对象、目标部门、目标密级、动作、变更前后摘要、IP、User-Agent、trace_id 和时间。
- 审计日志不记录密钥、Token、密码、Cookie、完整附件内容、完整外部响应或其他敏感明文。
- `old_value` 和 `new_value` 使用 JSON 摘要，3B 仅建字段，字段脱敏规则在业务层实现。
- 审计表不提供删除入口，不加 `deleted_at`。

### 权限隔离字段策略

- 所有核心业务资源预留 `department_id`、`owner_user_id`、`created_by_id`、`updated_by_id`、`secret_level`、`status`。
- 成果主表是权限判断的主事实来源，费用、附件、提醒、审计保留必要部门或目标对象字段，便于 Step 4 做统一策略。
- `resource_access_grants` 作为涉密或专项授权表，支持按用户、角色或部门授权，但 Step 3 不实现授权判断。
- 列表、详情、搜索、看板、附件下载和审计查询的最终权限裁剪在 Step 4+ 后端策略层完成，前端不作为安全边界。

## API 契约

### 输入

- 认证：账号密码或后续 SSO token。
- 成果：成果主字段、类型详情字段、贡献者、附件引用、草稿/提交动作。
- 审批：任务 ID、审批动作、审批意见。
- 费用：关联对象、费用类型、金额、截止日期、缴费状态、凭证附件。
- 检索：关键词、成果类型、部门、年份、密级、状态等筛选条件。
- 看板：视角、部门、时间范围和指标集合。

### 输出

- 统一返回业务对象、分页信息、状态码、错误语义和权限提示。
- 列表和看板只返回当前用户权限范围内数据。
- 附件下载返回短期有效下载响应或后端流式响应，不返回真实存储路径。

### 公开 API 草案

- `POST /auth/login`、`GET /me`
- `GET/POST /achievements`、`GET/PATCH /achievements/:id`
- `POST /achievements/:id/submit`、`POST /achievements/:id/void`
- `GET /approval/tasks`、`POST /approval/tasks/:id/approve`、`POST /approval/tasks/:id/reject`
- `POST /achievements/:id/attachments`、`GET /attachments/:id/download`
- `GET/POST /fees`、`POST /fees/:id/mark-paid`、`GET /fees/warnings`
- `GET /search`、`GET /dashboard/summary`
- `GET /audit-logs`
- `POST /integrations/doi/lookup`、`POST /notifications/test-email`

### 错误语义

- 400：字段缺失、格式错误、状态不允许流转。
- 401：未登录或会话失效。
- 403：无角色权限、跨部门越权、涉密未授权、附件下载越权。
- 404：对象不存在或对当前用户不可见。
- 409：唯一性冲突、重复提交、审批任务已处理。
- 422：业务规则不满足，例如已归档成果不能直接修改。
- 500：服务端异常；必须写入错误日志和 trace_id。
- 503：外部接口不可用；使用手工录入降级路径。

## 状态清单

- 默认：展示用户权限范围内的数据和可执行操作。
- 加载：列表、详情、看板、附件上传、审批提交均有加载状态。
- 空：无成果、无待办、无费用预警、无搜索结果时显示明确空状态。
- 错误：字段错误、唯一冲突、接口失败、附件失败均显示可理解错误。
- 成功：保存、提交、审批、归档、缴费、上传、下载准备完成后有成功反馈。
- 权限不足：隐藏不可执行按钮；直接访问无权资源时显示权限不足，不泄露敏感详情。

## 权限规则

- 科研人员：本人数据可读写，提交后按状态限制编辑。
- 科研秘书：本部门数据可读写，可审核本部门待办，可管理部门费用。
- 部门管理员：本部门基础数据和成果只读为主。
- 主管/院领导：可看全院汇总，详情下钻按授权控制。
- 涉密管理员：可访问授权范围内涉密成果和附件。
- 审计人员：只读归档数据和日志。
- 系统管理员：可配置系统，不允许绕过业务流程直接篡改业务数据。

## 架构边界

- 核心业务：成果状态机、审批状态机、权限策略、费用预警规则、审计记录。
- UI / 展示：表单、列表、看板和用户交互，不承载最终权限判断。
- 数据访问：Repository/ORM 层封装数据库，不在控制器中拼接数据规则。
- 外部依赖：DOI、邮件、HR、财务、专利状态、对象存储通过 adapter。
- 可替换点：认证、搜索引擎、对象存储、通知渠道、外部数据源。

## 验收标准

- [ ] 科研人员可创建论文、专利、软著草稿并提交审批。
- [ ] DOI、申请号、授权号、软著登记号等唯一性校验生效。
- [ ] 部门科研秘书只能处理本部门待办。
- [ ] 系统管理员可归档通过初审的成果。
- [ ] 跨部门访问、涉密访问、附件下载均受权限控制。
- [ ] 费用记录可创建、标记缴费、生成预警。
- [ ] 基础搜索结果按权限过滤。
- [ ] 看板按个人、部门、全院视角返回不同数据。
- [ ] 核心写操作和附件下载均写入审计日志。
- [ ] DOI 和邮件 adapter 可 mock 演示失败降级。

## 非目标

- 不实现真实短信。
- 不实现完整移动端。
- 不实现完整成果转化闭环。
- 不实现复杂自定义报表引擎。
- 不实现真实财务、CNIPA、Scopus、Dimensions 联调。

## 开放问题

- 一期是否要求真实 SSO 登录。
- 涉密附件是否需要一期实际加密落地。
- 一期部署环境和备份策略是否已有院内标准。
