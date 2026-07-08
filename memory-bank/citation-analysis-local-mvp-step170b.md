# Step170B - 引文分析本地统计 MVP

日期：2026-07-08

## 结论

本 Step 为“科研成果与知识产权管理系统”补齐了 **local-demo / local Docker
production-like** 范围内的引文分析本地统计能力：

- `/dashboard/summary` 返回 `citationImpact`，包含全院总引用次数、平均引用、H-index、可分析成果数。
- 引文统计支持按部门、按科研人员和按成果排行。
- H-index、平均引用和本地引用次数派生算法已有单元测试。
- 统计看板展示“引文影响力”模块，包含总引用次数、平均引用、H-index、部门影响力和科研人员影响力。
- 成果详情展示单项成果的“引用次数 / 学术影响摘要”。

该结论不能等同于 DOI、Crossref、Scopus、OpenAlex 等外部文献库真实联调完成，也不能等同于生产级引文同步完成。

## 本 Step 边界

本 Step 只处理本系统本地统计能力：

- 不访问 production / VPS / 生产 DB。
- 不读取 `.env` / `.env.production` / 密钥 / Token / Cookie / 密码 / 连接串。
- 不调用 DOI / Crossref / Scopus / OpenAlex。
- 不新增真实外部同步任务。
- 不做高风险数据库大改；当前未新增 Prisma 迁移。
- 不把本地派生引文统计说成真实外部引文源同步。

## 实现口径

当前仓库没有独立的 `citationCount` 字段。本 Step 采用低风险本地派生方案：

- 仅对论文成果计算本地引用次数。
- 计算依据来自既有论文字段：
  - DOI
  - 发表年份
  - 收录类型
  - 影响因子
  - 成果状态
- 专利和软件著作权不计入论文引文次数，引用次数为 0。
- `citationImpact.source` 返回 `LOCAL_DERIVED`。
- `externalSourceStatus` 返回 `RESERVED_INTERFACE`。

该口径用于本地评审演示和需求覆盖补强，不替代真实文献库数据。

## 后端能力

新增 / 调整：

- `apps/api/src/dashboard/domain/citation-analytics.ts`
  - `estimateLocalCitationCount`
  - `calculateHIndex`
  - `buildCitationOverview`
  - `buildCitationImpactSummary`
- `apps/api/src/dashboard/dashboard.repository.ts`
  - `listCitationAnalysisAchievements`
  - 只读查询成果、部门、负责人和论文字段，不读取附件、审计、费用明细或外部接口明细。
- `apps/api/src/dashboard/dashboard.service.ts`
  - 在 `/dashboard/summary` 中返回 `citationImpact.summary`。

测试覆盖：

- `apps/api/src/dashboard/domain/citation-analytics.spec.ts`
- `apps/api/src/dashboard/dashboard.service.spec.ts`
- `apps/api/src/dashboard/dashboard.repository.spec.ts`

## 前端能力

新增 / 调整：

- `apps/web/src/types.ts`
  - 新增 `CitationImpactSummary`、部门影响力、科研人员影响力等类型。
- `apps/web/src/Dashboard.tsx`
  - 统计看板展示总引用次数、平均引用、H-index、可分析成果。
  - 新增“引文影响力”模块，展示部门影响力和科研人员影响力。
  - 页面文案明确“本地统计”和“外部文献库预留接口”。
- `apps/web/src/AchievementDetail.tsx`
  - 成果详情展示引用次数和学术影响摘要。
  - DOI/Crossref/Scopus/OpenAlex 明确为后续可接入能力。

测试覆盖：

- `apps/web/src/Dashboard.test.ts`
- `apps/web/src/AchievementDetail.test.ts`

## 需求覆盖影响

| 需求项 | Step170B 后状态 | 说明 |
| --- | --- | --- |
| 引用次数统计 | 本地统计 MVP | 基于成果台账字段派生引用次数 |
| H-index | 本地统计 MVP | 全院、部门、人员维度可计算 |
| 平均引用 | 本地统计 MVP | 全院、部门、人员维度可计算 |
| 按个人统计 | 本地统计 MVP | 以成果负责人作为科研人员统计维度 |
| 按部门统计 | 本地统计 MVP | 以成果所属部门统计 |
| 按全院统计 | 本地统计 MVP | 在当前权限范围内汇总 |
| DOI/Crossref/Scopus/OpenAlex 同步 | 后续可接入 | 本 Step 不调用真实外部文献库 |

## 对外说明口径

可说明：

> 当前提交版已补齐本地引文分析 MVP：系统可基于成果台账字段展示总引用次数、平均引用、H-index，并按部门、科研人员和成果排行展示引文影响力；DOI/Crossref/Scopus/OpenAlex 已作为后续可接入能力预留。

不可说明：

> 已完成 DOI/Crossref/Scopus/OpenAlex 真实联调、已同步真实引用次数、已完成生产级引文同步任务。

## 验证记录

- `corepack pnpm --filter @research-ip/api test -- citation dashboard.service dashboard.repository`
  - 通过：3 files / 32 tests。
- `corepack pnpm --filter @research-ip/web test -- Dashboard AchievementDetail`
  - 通过：2 files / 50 tests。

后续提交前还需执行：

- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`
- `git diff --cached --check`

## 安全确认

- 未读取 `.env` / `.env.production`。
- 未访问 production / VPS / 生产 DB。
- 未调用 DOI / Crossref / Scopus / OpenAlex。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore`、`git clean`。
- 未触碰既有 `.local-step*`、`.learnings`、`apps/api/deploy`、`local-prod-preview-proxy.cjs`。
