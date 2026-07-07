# Step 139 - 甲方视角冻结前审查

日期：2026-07-07

当前审查基线：`9e31d63 feat: polish remaining client-facing terminology`

## 结论

当前项目**不应冻结为生产交付版**。

当前项目可以继续按以下口径推进冻结：

> 本地演示 / 竞赛评审 / synthetic 数据交付版，核心一期需求和 Route B 增强可展示，但不是 production/VPS/生产 DB/真实外部系统验收。

从甲方视角看，代码冻结前还缺最后一件 P0：

- 使用最新前端 bundle 做一次真实浏览器逐页截图验收。

源码和自动化测试已经完成 Step 134-Step 138 的前端去工程化、中文化收口；但截图中的旧页面能证明：只看源码不够，必须确认浏览器运行中的包也已经刷新。

## 需求实现判断

已可按本地演示口径说明完成：

- 成果登记：论文、专利、软件著作权。
- 成果提交、审批、归档、作废等基础流转。
- 角色权限、部门范围、涉密摘要和附件安全摘要。
- 费用台账、费用审核、费用凭证附件安全摘要。
- 检索中心、统计看板、脱敏审计日志。
- 部门维护、账号管理、账号生命周期安全摘要。
- 导入预检、导入记录、导入行级安全摘要。
- 自定义报表、成果转化台账、涉密授权只读管理。
- Mock/adapter 方式展示外部接口配置和调用日志。

不能按生产口径声明完成：

- 生产上线、VPS 验收、生产 DB 验收。
- 真实 HR/SSO、真实邮件短信、真实财务系统。
- 真实 DOI、文献库、专利平台、对象存储。
- 生产监控、灾备、备份恢复演练、真实压测。
- 完整移动端体验。
- 涉密授权创建/撤销/审批/批量授权。
- 导入 retry、rollback、raw CSV/raw JSON、导出下载。

## 前端展示当前状态

已完成的展示清理：

- 顶部登录、导航和状态标签已转为中文业务表达。
- `Custom Reports`、`Secret Authorization`、`Phase 1 frontend`、`production auth` 等普通页面文案已替换。
- 成果、账号、部门导入从 `dry-run` 改为“导入预检”。
- 导入表格中的 `Row`、`Safe preview`、`Candidate`、`Errors`、`Warnings` 等已中文化。
- 账号创建、角色范围、部门选择、外部接口归档确认等表单/弹窗已中文化。
- 附件和费用凭证中的 `metadata`、`storageKey`、`checksum`、`detail metadata` 等用户可见技术词已替换为安全摘要表达。
- 网络失败不再展示浏览器原始 `Failed to fetch` / CORS 文案，而是展示本地服务不可用的安全提示。

仍允许作为数据值出现：

- CSV 上传列名，例如 `email`、`departmentCode`、`roleCode`。
- 后端安全校验码，例如 `UNKNOWN_DEPARTMENT`、`DUPLICATE_IN_FILE`。
- 业务标准缩写，例如 DOI。

这些属于“文件结构/安全校验数据”，不是普通页面引导文案。评审时需要说明它们是导入预检返回的安全码。

## 冻结前 P0 清单

1. 刷新或重建正在演示的 Web 前端包。
2. 用真实浏览器逐页检查：
   - 登录页。
   - 工作台。
   - 成果管理和成果导入预检。
   - 审批管理。
   - 费用管理和费用凭证附件。
   - 检索中心。
   - 统计看板。
   - 自定义报表。
   - 审计日志。
   - 系统配置。
   - 涉密授权管理。
   - 账号管理。
   - 部门维护。
3. 截图确认页面不出现：
   - `GET /...`、`POST /...`、`X-Demo-User-Id`。
   - `Step xx`、`dryRun=true`、`local/demo`、`not production` 等验收口径。
   - `Failed to fetch`、`Network request failed`。
   - `session`、`production auth`、`Phase 1 frontend` 这类工程状态标签。
   - raw JSON、debug、export、download、batch mutation 等非本地演示入口。
4. 将截图和浏览器检查结果归档为本地演示证据。

## P1 建议

- 准备最终演示脚本，按角色说明“可做什么、不能做什么”。
- 演示前准备一页边界说明：本地 synthetic / mock adapter / 非 production。
- 对上传 CSV 中的英文列名和安全错误码准备口头解释，避免被误认为页面未中文化。

## 验证记录

最近一次源码与自动化验证：

- `corepack pnpm --filter @research-ip/web test -- App Achievement AchievementDetail AccountManagement DepartmentManagement Fees SettingsApiIntegrations`: PASS，9 files / 208 tests。
- `corepack pnpm --filter @research-ip/web typecheck`: PASS。
- 定向源码扫描显示：普通页面文案中的关键开发词已清理；剩余命中主要是内部变量、类型名、CSS 类名、CSV 字段名或安全过滤常量。

## 边界

本 Step 是 docs-only 审查归档。

- 未读取 `.env` 或 `.env.production` 内容。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未操作 Docker。
- 未修改 API、Prisma schema 或 migration。
