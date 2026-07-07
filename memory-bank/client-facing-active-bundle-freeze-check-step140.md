# Step 140 - 甲方视角真实运行包冻结检查

日期：2026-07-07

审查基线：`7cee76d docs: audit client-facing freeze readiness`

## 结论

当前**不能冻结代码**，原因不是新增需求未做，而是当前可访问的本地 Web
运行包仍然像旧包。

从甲方视角看，`http://127.0.0.1:18081` 当前发布出来的前端包仍包含截图中
暴露的工程化文案，例如：

- `Phase 1 frontend`
- `production auth`
- `session`
- `GET /`
- `POST /`
- `X-Demo-User-Id`
- `dryRun=true`
- `Achievement CSV dry-run`
- `Safe preview`
- `Network request failed`
- `Custom Reports`
- `Secret Authorization`
- `local/demo`
- `not production`
- `raw JSON`
- `debug`

这意味着：即使源码已经在 Step 134-Step 138 做了中文化和去工程化收口，当前演示
环境仍可能加载旧 bundle。冻结前必须先刷新或重建实际演示用 Web 包，并重新做浏览器
截图验收。

## 服务检查

只读 HTTP 检查结果：

- `http://127.0.0.1:3000/api/health`：不可连接。
- `http://127.0.0.1:14001/api/health`：`200 OK`。
- `http://127.0.0.1:5173`：不可连接。
- `http://127.0.0.1:5174`：不可连接。
- `http://127.0.0.1:18081`：`200 OK`。

因此本次检查对象是当前可访问的本地 Docker / production-like Web 入口
`18081`，不是 Vite dev server。

证据文件：

- `.local-step140-client-facing-freeze-check/service-checks.txt`
- `.local-step140-client-facing-freeze-check/active-bundle-text-scan.txt`
- `.local-step140-client-facing-freeze-check/source-text-scan.txt`

## 源码与运行包差异判断

对 `apps/web/src` 排除测试文件后做同一组关键词扫描，结果显示：

- `Phase 1 frontend`、`production auth`、`Achievement CSV dry-run`、`Safe preview`
  等截图中的普通页面文案没有继续作为普通源码文案出现。
- 剩余命中主要是：
  - 内部变量名，例如 `createCandidates`、`candidateAction`。
  - 类型名，例如 `CreateFeeFormErrors`。
  - API client 内部 header 设置，例如 `X-Demo-User-Id`。
  - 类型定义中的 `DryRun`。

因此当前优先判断是：**实际运行服务未使用最新前端构建**，而不是必须继续大规模修改
前端源码。

## 冻结前必须修改/处理的地方

### P0：必须做

1. 重建或刷新当前演示入口 `18081` 对应的 Web bundle。
2. 重新打开浏览器逐页截图验收：
   - 登录页。
   - 工作台。
   - 成果管理与导入预检。
   - 审批管理。
   - 费用管理与费用凭证。
   - 检索中心。
   - 统计看板。
   - 自定义报表。
   - 审计日志。
   - 系统配置。
   - 涉密授权管理。
   - 账号管理。
   - 部门维护。
3. 确认普通页面文案不再出现：
   - API 路径和方法，例如 `GET /...`、`POST /...`。
   - 演示 header 或内部权限提示，例如 `X-Demo-User-Id`。
   - 工程状态标签，例如 `session`、`production auth`、`Phase 1 frontend`。
   - 验收口径文案，例如 `local/demo`、`not production`、`Step xx`。
   - 导入实现参数，例如 `dryRun=true`、`dry-run`。
   - 浏览器原始错误，例如 `Network request failed`。
   - raw JSON、debug、export、download、batch mutation 等非甲方展示入口。

### P1：建议做

1. 给最终演示准备一页中文边界说明：
   - 本地 synthetic 数据。
   - mock/adapter 外部接口。
   - 非 production/VPS/真实外部系统验收。
2. 对 CSV 列名和后端安全错误码准备解释口径：
   - `email`、`departmentCode`、`roleCode` 是导入文件列名。
   - `UNKNOWN_DEPARTMENT`、`DUPLICATE_IN_FILE` 是安全校验码。

## 是否还要改项目代码

当前证据不支持直接继续大改源码。

更准确的下一步是：

1. 先把当前运行的 Web 包刷新到最新源码。
2. 再做真实浏览器截图验收。
3. 如果刷新后页面仍出现普通可见英文、API 路径、debug/export/download 或
   production/demo 工程标签，再按页面逐项修改源码。

## 边界

- 本次是只读/文档归档和 HTTP 文本扫描。
- 未读取 `.env` 或 `.env.production` 内容。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未操作 Docker。
- 未修改 `apps/**`、`prisma/**`、schema 或 migration。
