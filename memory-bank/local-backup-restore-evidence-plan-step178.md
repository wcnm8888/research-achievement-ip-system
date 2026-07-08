# Step178 - 本地备份 / 恢复证据补强计划确认

日期：2026-07-08

项目定位保持为：

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本计划只确认本地备份 / 恢复证据补强路径，不执行真实备份、恢复、迁移或数据库写操作。本计划不能表述为真实生产上线完成版、真实外部系统联调完成版、VPS/生产 DB 验收完成版，也不能表述为生产灾备验收完成。

## 本 Step 目标

- 梳理已有本地 PostgreSQL 备份、manifest、SHA-256 校验和恢复 dry-run 证据。
- 梳理附件二进制备份 manifest / artifact-list / digest 能力。
- 明确下一步执行阶段可跑的命令、只读 / dry-run 边界、禁止动作和证据记录方式。
- 明确生产 / 二期仍待接入的灾备能力。

## 已读取的最小上下文

- `memory-bank/final-acceptance-coverage-step174.md` 中 Step170A 和 7.4 / 7.5 相关小段。
- `memory-bank/security-compliance-negative-acceptance-execution-step177.md`。
- `memory-bank/testing-strategy.md` 的标题和备份 / 恢复关键词索引。该文件未提供直接备份 / 恢复测试策略命中。
- `memory-bank/progress.md` 中最近 Step177 小段和 Step174 对 Step170A-D 的引用小段。
- `memory-bank/evidence.md` 中最近 Step177 小段和 Step174 对 Step170A-D 的引用小段。
- `memory-bank/local-backup-restore-acceptance-step170a.md`。
- `memory-bank/local-backup-restore-commands-step170a.md`。
- 备份 / 恢复相关脚本、测试、文档索引。

本 Step 未读取 `.env`、`.env.production`、密钥、Cookie、Token、生产连接串或生产备份文件内容。

## 本地一期可验证能力

### 1. 本地 PostgreSQL 手动即时备份

已有 Step170A 证据显示，在 local Docker production-like 范围内可以：

- 通过本地 PostgreSQL 容器运行 `pg_dump`。
- 生成本地 SQL dump。
- 生成 JSON manifest。
- 在 manifest 中记录本地来源、数据库名、dump 文件名、字节数、SHA-256、容器边界、恢复演练模式和生产边界。
- 重新计算 SHA-256 并与 manifest 比对。
- 检查 SQL dump header / schema 标识。

证据来源：

- `memory-bank/local-backup-restore-acceptance-step170a.md`
- `memory-bank/local-backup-restore-commands-step170a.md`

边界：

- 这是本地 `local Docker production-like` 手动备份证据。
- 不等同于生产每日自动备份、生产 30 天留存、生产 RTO/RPO 或真实恢复演练通过。

### 2. 附件二进制备份 manifest / artifact-list 能力

已有 API operations 代码和测试显示，附件二进制备份工具可以：

- 构建附件 archive。
- 生成附件备份 manifest。
- 生成 artifact list。
- 将已有 Postgres dump 作为 `POSTGRES_DUMP` artifact 纳入 artifact list。
- 对附件 archive 和 manifest 生成 whole-artifact digest。
- 记录 aggregate counts、缺失二进制、额外二进制、不支持 relation type 和 manifest consistency。
- 测试确认 manifest / artifact list 不暴露 `storageKey`、raw key、附件内容、`checksum`、凭证号、金额等敏感细节。

证据来源：

- `apps/api/src/operations/attachment-binary-backup.ts`
- `apps/api/src/operations/attachment-binary-backup.spec.ts`
- `apps/api/package.json` 中 `ops:backup:attachments`

边界：

- 本计划阶段不执行附件备份落地产物。
- 当前证据不等同于真实对象存储备份、异地备份或生产附件恢复演练。

### 3. 本地备份集 metadata / schema / sample 能力

已有 `deploy/` 文档和静态校验脚本显示，仓库已定义本地-only backup artifact-list metadata 方向：

- `deploy/local-backup-artifact-list.schema.json`
- `deploy/local-backup-artifact-list.sample.json`
- `deploy/validate-local-backup-artifact-list-sample.mjs`
- `deploy/local-backup-artifact-metadata-design.md`

可验证点：

- artifact-list schema / sample 包含 `POSTGRES_DUMP`、`ATTACHMENT_BINARY_ARCHIVE`、`ATTACHMENT_BACKUP_MANIFEST`。
- digest 采用 `sha256:<64 hex>` 形态。
- readiness 中包含 retention、encryption、offsite、restoreReadiness 的本地-only 状态。
- validator 只解析已提交 schema 和 synthetic sample，不运行 Docker，不读取 `.env`，不执行备份、加密、上传、恢复或访问 production/VPS。

## 建议下一步执行清单

下一步 Step178-执行建议分成三组，执行前再次确认工作树状态和本地边界。

### A. 只读 / 静态验证

这些命令不应访问生产、VPS、生产 DB、真实对象存储或 `.env` 内容：

```powershell
git status --short --branch
node deploy/validate-local-backup-artifact-list-sample.mjs
corepack pnpm --filter @research-ip/api test -- attachment-binary-backup
```

建议记录：

- 命令。
- PASS / FAIL。
- 若失败，只记录失败类别和安全摘要，不记录敏感路径、密钥、连接串或备份文件内容。

### B. 本地备份产物验证

仅在用户授权 Step178-执行阶段创建或复用本地备份产物时运行。产物必须留在 `.local-step178-*` 或用户确认的本地目录，不能提交。

建议命令类别：

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "research-achievement-production"
```

```powershell
# 只在执行阶段授权后运行。本命令会读取本地 Docker PostgreSQL 并写入本地 dump 文件。
docker exec research-achievement-production-postgres-1 pg_dump `
  -U research_achievement_app `
  -d research_achievement_production `
  --no-owner `
  --no-privileges `
  --encoding=UTF8 `
  > <local-step178-dump-path>
```

```powershell
Get-FileHash -LiteralPath <local-step178-dump-path> -Algorithm SHA256
```

```powershell
# 只读取 manifest JSON 元数据，不读取 .env，不读取生产连接串。
Get-Content -LiteralPath <local-step178-manifest-path> -Raw | ConvertFrom-Json
```

建议记录：

- dump basename。
- dump bytes。
- whole-artifact SHA-256。
- manifest basename。
- `sha256Matches: true/false`。
- local container summary。
- `restoreRehearsalMode: dry-run / non-destructive`。
- `productionBoundary: not production backup; not VPS; not production DB`。

不建议记录：

- dump SQL 内容。
- 生产连接串。
- 凭证。
- 原始附件存储 key。
- 附件 per-file checksum。
- 业务文件名、凭证号、金额或文件内容。

### C. 恢复 dry-run / 只读演练

本阶段不允许执行写入目标库的恢复。下一步只建议做非破坏性检查：

```powershell
# SQL dump 场景：只检查 header / schema markers，不导入。
Get-Content -LiteralPath <local-step178-dump-path> -TotalCount 80
```

如果未来改用 PostgreSQL custom-format dump，可在单独授权后仅运行 list 类检查：

```powershell
pg_restore --list <local-step178-custom-dump-path>
```

注意：

- `pg_restore --list` 只允许用于 list / inspect，不允许带 `--dbname` 写入任何目标库。
- 不允许对当前本地库、生产库、VPS 库或任何真实业务库执行恢复覆盖。
- 真实恢复演练必须另开 Step，且只能恢复到隔离的一次性目标库或容器，并先确认 target guard。

## 明确禁止动作

本 Step 和下一步未单独授权前均禁止：

- 读取 `.env`、`.env.production`、密钥文件、Cookie、Token、生产连接串。
- 访问 production / VPS / 生产 DB。
- 访问真实对象存储、真实外部备份服务或真实告警平台。
- 执行真实恢复。
- 执行数据库覆盖、清空、迁移、回滚、seed、backfill 或写入。
- 对任何目标库执行写入型 `pg_restore`。
- 使用 `psql < dump` 或等价导入命令。
- 删除文件或目录。
- 执行 `git reset`、`git restore`、`git clean`。
- 执行 Docker prune / volume prune / volume 删除。
- 批量清理备份文件。
- 提交 `.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables`、真实备份文件、restore 输出文件、dump 文件、manifest 运行产物、截图、性能日志或临时脚本。

## manifest / SHA-256 / 恢复 dry-run 证据记录方式

建议在执行阶段新增执行证据文档时，只记录脱敏摘要：

```text
- backupSetId: <local non-sensitive id>
- source: local Docker production-like
- database: research_achievement_production
- dumpBasename: <basename only>
- dumpBytes: <number>
- dumpSha256: sha256:<64 hex> 或 <64 hex>
- manifestBasename: <basename only>
- manifestBytes: <number>
- sha256Recomputed: PASS / FAIL
- postgresHeaderCheck: PASS / FAIL
- schemaMarkerCheck: PASS / FAIL
- restoreDryRunMode: non-destructive metadata/header/list inspection only
- restoreWriteExecuted: false
- productionBoundary: not production backup; not VPS; not production DB
```

附件备份 evidence 只记录 aggregate 信息：

```text
- artifactCategories: POSTGRES_DUMP, ATTACHMENT_BINARY_ARCHIVE, ATTACHMENT_BACKUP_MANIFEST
- artifactBasenames: basename only
- artifactByteCounts: aggregate / per artifact bytes
- digestStatus: PASS / FAIL
- manifestConsistency: PASS / WARNING / FAILED
- issueSummary: aggregate codes and counts only
- sensitiveExposureCheck: PASS / FAIL
```

恢复 dry-run evidence 只记录：

- 是否完成 SHA-256 复算。
- 是否完成 manifest 解析。
- 是否完成 SQL header / custom-format list 检查。
- 是否确认未执行恢复写入。
- 是否确认未触碰生产 / VPS / 生产 DB。

## 生产 / 二期待接入内容

以下内容仍属于二期 / 生产待接入，不能纳入本地一期完成声明：

- 每日自动备份调度。
- 30 天留存策略和自动留存执行证据。
- 真实恢复演练。
- RTO / RPO 验收。
- 异地备份。
- 生产备份监控告警。
- 生产审计日志归档 / 防篡改。
- 生产加密密钥管理和最小权限备份账号。
- 真实对象存储 / backup vault 选择和权限验收。
- 生产备份失败重试、失败告警和人工升级流程。

备注：现有 `deploy/backup-retention-encryption-offsite-policy.md` 中已有生产 retention 分层描述，后续生产化 Step 需要与“一期验收缺口中的 30 天留存”口径统一。本 Step 不修改生产 retention 策略。

## 安全边界确认

- 本 Step 只做计划确认和文档补强。
- 未执行真实备份。
- 未执行恢复。
- 未执行迁移。
- 未执行数据库写操作。
- 未访问 production / VPS / 生产 DB。
- 未读取 `.env`、`.env.production`、密钥、Cookie、Token 或生产连接串。
- 未访问真实对象存储、外部备份服务或告警平台。
- 未删除文件或目录。
- 未处理已有 `.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables` 或真实备份产物。
