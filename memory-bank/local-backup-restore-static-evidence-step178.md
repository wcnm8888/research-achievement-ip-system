# Step178 - 本地备份 / 恢复静态证据执行收口

日期：2026-07-08

项目定位保持为：

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本执行证据只覆盖只读验证、静态校验和已有测试复跑。它不能表述为真实生产上线完成版、真实外部系统联调完成版、VPS/生产 DB 验收完成版、生产备份完成、生产恢复演练完成或生产灾备验收完成。

## 本次执行范围

本次只执行低风险静态收口：

- 校验本地 backup artifact-list schema / sample / validator 可用。
- 复跑附件备份 manifest / digest / artifact-list / 敏感信息不暴露相关单元测试。
- 将 Step170A 本地 PostgreSQL 备份、manifest、SHA-256、恢复 dry-run 边界作为历史证据纳入当前结论。

本次未执行：

- 未执行 `pg_dump`。
- 未生成真实数据库 dump。
- 未创建 `.local-step178-*` 备份产物。
- 未执行真实恢复。
- 未执行数据库覆盖、清空、迁移或写入。
- 未执行写入型 `pg_restore`。
- 未执行 `psql < dump`。

## 静态 validator 结果

命令：

```powershell
node deploy/validate-local-backup-artifact-list-sample.mjs
```

结果：PASS。

输出摘要：

```text
Local backup artifact-list sample validation PASS
Validated required categories: POSTGRES_DUMP, ATTACHMENT_BINARY_ARCHIVE, ATTACHMENT_BACKUP_MANIFEST
```

覆盖点：

- `deploy/local-backup-artifact-list.schema.json` 使用 `BACKUP_ARTIFACT_LIST` schema。
- `deploy/local-backup-artifact-list.sample.json` 为本地 synthetic sample。
- 必需 artifact 类别包含 `POSTGRES_DUMP`、`ATTACHMENT_BINARY_ARCHIVE`、`ATTACHMENT_BACKUP_MANIFEST`。
- digest 形态按 `sha256:<64 hex>` 校验。
- `productionReadinessClaim` 必须为 `false`。
- readiness 包含 retention、encryption、offsite、restoreReadiness 的本地-only 状态。
- sample 中明显敏感标记检查通过。

边界：

- validator 只读取已提交 schema / sample。
- validator 不运行 Docker。
- validator 不读取 `.env`。
- validator 不执行备份、加密、上传、恢复。
- validator 不访问 production / VPS / 生产 DB。

## API 测试结果

命令：

```powershell
corepack pnpm --filter @research-ip/api test -- attachment-binary-backup
```

结果：PASS。

输出摘要：

```text
Test Files 1 passed (1)
Tests 2 passed (2)
```

备注：测试输出包含 Vite CJS Node API deprecation warning，属于工具链提示，不影响本次附件备份证据验收结论。

覆盖点：

- `buildAttachmentBinaryBackup` 可构建附件 archive。
- 可生成附件备份 manifest。
- 可生成 artifact list。
- 可把已有 `POSTGRES_DUMP` artifact 纳入 artifact list。
- 可生成 archive / manifest whole-artifact digest。
- manifest 可记录 aggregate counts、missing binary、extra binary、unsupported relation 和 consistency 状态。
- 测试确认 manifest / artifact list 不暴露 `storageKey`、raw key、附件内容、`checksum`、凭证号或金额。
- 缺失二进制时 manifest consistency 可标记为 `FAILED`，且仍不暴露 raw key 或业务文件名。

## 已确认的本地备份 / 恢复证据来源

- `memory-bank/local-backup-restore-evidence-plan-step178.md`
- `memory-bank/local-backup-restore-acceptance-step170a.md`
- `memory-bank/local-backup-restore-commands-step170a.md`
- `deploy/local-backup-artifact-list.schema.json`
- `deploy/local-backup-artifact-list.sample.json`
- `deploy/validate-local-backup-artifact-list-sample.mjs`
- `deploy/local-backup-artifact-metadata-design.md`
- `apps/api/src/operations/attachment-binary-backup.ts`
- `apps/api/src/operations/attachment-binary-backup.spec.ts`
- `apps/api/package.json` 中 `ops:backup:attachments`

Step170A 历史证据纳入范围：

- 本地 PostgreSQL 可通过 `pg_dump` 形成手动即时备份的历史证据。
- 本地备份可生成 manifest。
- manifest 可记录文件大小、SHA-256、来源和本地容器边界。
- 已有一次非破坏性校验记录：备份文件存在、大小大于 0、SHA-256 可重新计算并匹配、SQL 文件包含 PostgreSQL dump / schema 标识。
- 已形成恢复 dry-run 计划，且没有覆盖或恢复当前本地数据库。

本次执行未复跑 Step170A 的 `pg_dump` 或任何备份产物生成命令。

## 本地一期可声明能力

在 `local-demo / local Docker production-like` 范围内，可声明：

- 已有本地 PostgreSQL 手动备份历史证据：`pg_dump` + manifest + SHA-256 校验。
- 已有本地备份 manifest / artifact-list metadata schema 和 synthetic sample 静态校验。
- 已有本地备份 artifact-list validator，且本次复跑通过。
- 已有附件二进制备份 manifest / digest / artifact-list 生成能力，并由单元测试覆盖。
- 附件备份 manifest / artifact-list 的敏感信息不暴露测试通过。
- 恢复能力当前为 dry-run / non-destructive 计划和只读检查边界，不包含真实恢复执行。

## 不可声明的内容

不得声明：

- 生产备份已完成。
- 生产每日自动备份已接入。
- 生产 30 天留存已完成自动化验收。
- 生产恢复演练已通过。
- RTO / RPO 已达标。
- VPS / 生产 DB 已验收。
- 真实外部对象存储或异地备份已接入。
- 真实外部备份服务或告警平台已接入。
- 生产审计日志归档 / 防篡改已完成。
- 当前本地数据库已经被恢复演练覆盖验证。

## 二期 / 生产待接入内容

以下仍为二期 / 生产待接入：

- 每日自动备份调度。
- 30 天留存策略和自动化执行证据。
- 真实恢复演练。
- RTO / RPO 验收。
- 异地备份。
- 生产备份监控告警。
- 生产审计日志归档 / 防篡改。
- 生产加密密钥管理和最小权限备份账号。
- 真实对象存储 / backup vault 选择和权限验收。
- 备份失败重试、失败告警和人工升级流程。

## 安全边界确认

- 未读取 `.env`。
- 未读取 `.env.production`。
- 未读取密钥、Cookie、Token 或生产连接串。
- 未访问 production / VPS / 生产 DB。
- 未访问真实对象存储。
- 未访问真实外部备份服务。
- 未访问真实告警平台。
- 未执行 `pg_dump`。
- 未执行真实恢复。
- 未执行数据库覆盖、清空、迁移或写入。
- 未执行写入型 `pg_restore`。
- 未执行 `psql < dump`。
- 未创建 `.local-step178-*` 备份产物。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore` 或 `git clean`。
- 未执行 Docker prune / volume prune / volume 删除。
- 未提交 `.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables`、真实备份文件、dump 文件、manifest 运行产物、restore 输出、截图、性能日志或临时脚本。
