# Step 144 - 甲方可见残留文案收口

日期：2026-07-07

审查基线：`6a6956f fix: align production login status copy`

## 结论

本 Step 继续按甲方视角扫描前端源码，修复了一批仍可能直接渲染到页面的英文或工程化
文案。

普通 JSX 文本扫描结果已经无英文文本节点命中。仍存在的英文命中主要是内部变量、
类型名、接口字段、请求头名称或安全字段名，不是普通页面文案。

## 修复范围

修改文件：

- `apps/web/src/AccountManagement.tsx`
- `apps/web/src/DepartmentManagement.tsx`
- `apps/web/src/AchievementDetail.tsx`
- `apps/web/src/Fees.tsx`
- `apps/web/src/AuditLogs.tsx`
- `apps/web/src/Search.tsx`
- `apps/web/src/Workbench.tsx`
- `apps/web/src/Dashboard.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/SettingsBoundary.tsx`
- `apps/web/src/components/StateBlocks.tsx`
- `apps/web/src/demo-users.ts`
- `apps/web/src/AuditLogs.test.ts`
- `apps/web/src/SettingsBoundary.test.ts`

主要文案收口：

- `Rejected codes` -> `拒绝原因代码`。
- `Error count` -> `错误数量`。
- `Achievement conversion ledger` -> `成果转化台账`。
- `Local/demo conversion deepening only` -> `成果转化本地演示记录`。
- `No conversion records` -> `暂无转化记录`。
- `Safe benefit allocation detail` -> `收益分配安全明细`。
- `Add allocation` -> `添加分配项`。
- `Remove` -> `移除`。
- `Fee review workflow task` -> `费用审核任务`。
- `Pending fee review task is assigned to current user` -> `当前用户可处理待审核费用任务`。
- `Approve fee review` -> `通过费用审核`。
- `take 1-100` / `take 1-50` -> `最多 100 条` / `最多 50 条`。
- `masked` / `masked readonly` / `unmasked` -> `已脱敏` / `脱敏只读` / `未脱敏`。
- `summary` 页面标签 -> `摘要`。
- `CUSTOM` -> `自定义`。
- `ACHIEVEMENT_DEPARTMENT_RANKING` -> `部门排行`。
- `INTEGRATION_MOCK_BY_INTEGRATION` -> `接口调用聚合`。
- `dashboard summary` -> `统计摘要`。
- `warnings API` -> `预警接口`。
- `Task ID` -> `任务标识`。
- `Step` 标签 -> `流程步骤` 或 `后续阶段`。
- `Token` / `Cookie` / `.env` 页面边界说明 -> `令牌` / `浏览器凭证` / `环境文件`。
- `v{version}` -> `版本 {version}`。

## 扫描结果

普通 JSX 文本节点扫描：

```text
rg -n --glob '!*.test.tsx' --glob '!*.test.ts' --glob '!*.spec.ts' --glob '!dist/**' --glob '!node_modules/**' '>[A-Za-z][^<]{2,}<' apps/web/src
```

结果：无命中。

最新构建包扫描证据：

```text
.local-step144-client-facing-copy-polish/latest-build-text-scan.txt
```

以下截图时代旧文案或工程化文案在最新构建包中为 0：

- `Phase 1 frontend`
- `production auth`
- `GET /`
- `POST /`
- `dryRun=true`
- `Achievement CSV dry-run`
- `Safe preview`
- `Failed to fetch`
- `Network request failed`
- `Custom Reports`
- `Secret Authorization`
- `local/demo`
- `not production`
- `raw JSON`
- `batch mutation`
- `Rejected codes`
- `Error count`
- `Achievement conversion ledger`
- `Fee review workflow task`
- `dashboard summary`
- `warnings API`
- `Task ID`
- `.env`
- `CRUD`
- `take 1-100`
- `take 1-50`
- `masked readonly`
- `unmasked`

仍有构建包命中但不作为普通页面文案处理：

- `X-Demo-User-Id`：内部请求头名称。
- `Status`：类型名、字段名或内部状态逻辑。
- `Token`：账号生命周期内部字段名或类型名。
- `oldValueMasked` / `newValueMasked`：审计日志安全字段名。

这些仍需要最终浏览器逐页截图确认，但当前源码 JSX 文本扫描没有普通可见英文文本。

## 验证命令

```text
corepack pnpm --filter @research-ip/web test -- App AchievementDetail Fees AuditLogs Search Workbench Dashboard AccountManagement DepartmentManagement SettingsBoundary
```

结果：PASS，10 files / 222 tests。

```text
corepack pnpm --filter @research-ip/web typecheck
```

结果：PASS。

```text
corepack pnpm --filter @research-ip/web exec vite build --outDir ../../.local-step144-client-facing-copy-polish/dist --emptyOutDir false
```

结果：PASS。

## 剩余冻结门槛

当前仍不能宣布完整代码冻结，因为：

1. 实际 `18081` 演示入口仍需刷新到最新 Web bundle。
2. 仍需使用真实浏览器和登录账号做完整页面截图验收。
3. 构建包中内部字段名命中需要通过 DOM/截图确认不会作为普通页面文案出现。

## 边界

- 未读取 `.env` 或 `.env.production` 内容。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未操作 Docker。
- 未修改 `prisma/**`、schema 或 migration。
