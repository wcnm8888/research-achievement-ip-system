# Step170C 定时报表推送本地预演 MVP

## 范围定位

本 Step 面向“研究院科研成果与知识产权管理系统 local-demo / local Docker production-like 评审提交版”，补强定时报表推送相关需求的本地可演示能力。

本 Step 不代表生产环境定时任务、真实邮件送达或外部通知通道已完成验收。

## 已实现能力

- 后端新增定时报表计划查询能力：
  - 科研成果月报。
  - 费用风险季报。
  - 审批效率年报。
- 后端新增定时报表生成预演能力：
  - 按计划调用现有自定义报表模板生成聚合摘要。
  - 生成本地站内信摘要记录。
  - 返回邮件通道预留状态，不连接真实邮件服务。
- 前端在自定义报表页新增“定时报表预演”模块：
  - 展示月报、季报、年报计划。
  - 展示报表类型、接收范围、下次计划周期。
  - 展示站内信状态为本地预演。
  - 展示邮件通道为预留接口。
  - 支持点击“生成预演”查看报表摘要和站内信摘要。

## 接口口径

- `GET /reports/scheduled-plans`：返回当前可预演的月报、季报、年报计划。
- `POST /reports/scheduled-plans/:planId/preview`：本地生成报表摘要并创建站内信摘要。

以上接口只用于本地评审提交版预演，不调用真实邮件、短信、企微或外部通知服务。

## 需求覆盖影响

- 按月 / 季 / 年自动生成报表：补强为本地预演 MVP，可展示计划并手动触发生成预演。
- 站内信推送：补强为本地站内信摘要 MVP。
- 邮件推送：保持为邮件通道预留接口，生产待接入。
- 报表生成记录：补强为本地预演返回记录与站内信摘要。
- 真实定时任务：生产待验收。
- 失败重试、退订、送达回执、生产审计留痕：生产待验收。

## 验证记录

- `corepack pnpm --filter @research-ip/api test -- reports notifications scheduled`
  - 4 个测试文件通过。
  - 34 个测试通过。
- `corepack pnpm --filter @research-ip/web test -- CustomReports`
  - 1 个测试文件通过。
  - 13 个测试通过。

后续还需执行：

- `corepack pnpm --filter @research-ip/api typecheck`
  - 通过。
- `corepack pnpm --filter @research-ip/web typecheck`
  - 通过。
- `git diff --check`
  - 通过。

提交前仍需在暂存后执行：

- `git diff --cached --check`

## 安全边界

- 未读取 `.env`、`.env.production`、密钥、Token、Cookie、密码或连接串。
- 未访问 production、VPS 或生产数据库。
- 未调用真实邮件、短信、企微或外部通知服务。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore`、`git clean`。
- 未触碰既有 `.local-step*`、`.learnings`、`apps/api/deploy`、`local-prod-preview-proxy.cjs`。
