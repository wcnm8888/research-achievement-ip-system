# Step170A - 本地备份/恢复验收 MVP

日期：2026-07-08

## 结论

本 Step 为“科研成果与知识产权管理系统”补齐了 **local-demo / local
Docker production-like** 范围内的备份/恢复验收证据：

- 本地 PostgreSQL 数据库可以通过 `pg_dump` 生成手动即时备份。
- 本地备份产物可以生成 manifest，记录文件大小、SHA-256、来源和容器边界。
- 已执行一次非破坏性校验：备份文件存在、大小大于 0、SHA-256 可重新计算并匹配、SQL 文件包含 PostgreSQL dump/schema 标识。
- 已形成恢复演练 dry-run 计划，但没有覆盖或恢复当前本地数据库。

该结论不能等同于生产备份完成、生产恢复演练完成、生产 RTO/RPO 达标或生产灾备验收完成。

## 本 Step 边界

本 Step 只处理本地 Docker production-like 环境：

- Web：`research-achievement-production-web-1`
- API：`research-achievement-production-api-1`
- PostgreSQL：`research-achievement-production-postgres-1`

明确未做：

- 未访问 production / VPS / 生产 DB。
- 未读取 `.env` / `.env.production` / 密钥 / Token / Cookie / 密码 / 连接串。
- 未执行破坏性恢复，未覆盖当前本地数据库。
- 未删除、清理或 prune Docker / 文件 / 目录。
- 未将本地备份说成生产备份。

## 备份对象

### PostgreSQL 数据库

本地数据库备份采用 Docker 容器内 `pg_dump`：

- 数据库：`research_achievement_production`
- 方式：手动即时导出 SQL
- 输出目录：`.local-step170a-backup-restore/`
- 产物类型：
  - `local-postgres-backup-YYYYMMDD-HHMMSS.sql`
  - `local-backup-manifest-YYYYMMDD-HHMMSS.json`

manifest 记录：

- `createdAt`
- `source`
- `database`
- `dumpFile`
- `dumpBytes`
- `sha256`
- `dockerContainers`
- `restoreRehearsalMode`
- `retentionPolicy`
- `productionBoundary`

### 附件二进制

仓库已有附件二进制备份工具：

- `apps/api/src/operations/attachment-binary-backup.ts`
- `apps/api/src/operations/attachment-binary-backup.spec.ts`

当前能力：

- 构建附件二进制 archive。
- 生成附件备份 manifest 和 artifact list。
- 统计附件数量、总字节数、按 relation type 分组、缺失二进制、额外二进制和不支持 relation type。
- 使用 digest 校验产物。
- 测试确认 manifest / artifact list 不暴露 `storageKey`、raw key、附件内容、凭证号、金额等敏感细节。

当前未做：

- 未接真实对象存储。
- 未执行附件备份落地产物。
- 未做生产附件恢复演练。

## 本地验收步骤

命令清单见：

- `memory-bank/local-backup-restore-commands-step170a.md`

执行步骤：

1. 确认本地 Docker 容器运行状态。
2. 创建 `.local-step170a-backup-restore/` 本地产物目录。
3. 使用 `docker exec research-achievement-production-postgres-1 pg_dump ...` 生成 SQL 备份。
4. 计算 SQL 文件 SHA-256。
5. 生成 JSON manifest。
6. 重新计算 SHA-256 并与 manifest 比对。
7. 检查 SQL 文件头部和 schema 标识。
8. 只记录 dry-run 恢复演练计划，不对当前数据库做恢复覆盖。

## 验收证据

本地备份产物默认不提交。实际执行后产物位于：

- `.local-step170a-backup-restore/`

本次本地执行结果：

- SQL dump：`local-postgres-backup-20260708-065328.sql`
- manifest：`local-backup-manifest-20260708-065328.json`
- SQL dump 大小：679,924 bytes
- manifest 大小：841 bytes
- SHA-256：`e8d0988ec68df0ac87de6914e9ab0e2882d9fabf4a3b83849ca5c72660a52416`
- 重新计算 SHA-256：通过
- PostgreSQL dump/header 标识：通过
- SQL schema 标识：通过
- 恢复模式：dry-run / non-destructive

本 Step 的验收判定以以下条件为准：

- 本地 PostgreSQL 容器存在并运行。
- SQL dump 文件存在。
- SQL dump 文件大小大于 0。
- manifest 文件存在。
- 重新计算的 SHA-256 与 manifest 中的 `sha256` 一致。
- SQL dump 包含 PostgreSQL dump/header 或 schema 标识。
- 没有执行破坏性 restore。

## 需求覆盖影响

| 需求项 | Step170A 后状态 | 说明 |
| --- | --- | --- |
| 支持手动即时备份 | 本地备份验收 MVP | local Docker 可演示 `pg_dump` + manifest + sha256 校验 |
| 数据备份 | 本地备份验收 MVP / 生产待验收 | 已有本地 PostgreSQL 备份证据；生产计划、调度和权限仍未验收 |
| 附件备份 | 部分完成 | 已有附件二进制备份工具和单元测试；未执行生产对象存储备份 |
| 每日自动全量备份 | 生产待验收 | 本 Step 不增加生产定时任务 |
| 备份保留 30 天 | 生产待验收 | 本地 manifest 写明目标；本地不自动清理旧产物 |
| 恢复演练 | dry-run 计划完成 / 实际恢复待验收 | 未覆盖当前本地库；生产或隔离库恢复需单独授权 |
| RTO<=4h / RPO<=30min | 生产待验收 | 本地文档给出验收边界，不能宣称生产达标 |

## 提交口径

对外可说明：

> 当前提交版已补齐本地 Docker production-like 的手动备份验收证据：可生成数据库 SQL 备份、manifest 和 SHA-256 校验；附件二进制备份已有 manifest/一致性校验工具。生产每日备份、30 天留存、RTO/RPO 和真实恢复演练仍需生产环境专项验收。

不可说明：

> 生产备份已完成、生产灾备已完成、RTO/RPO 已达标、生产数据库已恢复演练通过。

## 安全确认

- 未读取 `.env` / `.env.production`。
- 未访问 production / VPS / 生产 DB。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore`、`git clean`。
- 未执行 Docker prune。
- 未提交 `.local-step170a-backup-restore/` 本地备份产物。
