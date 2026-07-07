# Step 141 - 最新源码构建包甲方视角检查

日期：2026-07-07

审查基线：`40ea0d8 docs: record active bundle freeze blocker`

## 结论

最新源码构建出来的前端包，已经清掉截图中最核心的旧工程化文案。

当前阻塞不再优先判断为“继续大改源码”，而是：

> 当前可访问的 `http://127.0.0.1:18081` 仍在服务旧 Web bundle，需要重建或刷新演示入口后再做浏览器截图验收。

## 本次构建方式

为避免覆盖项目默认 `dist` 或清理现有文件，本次只把最新源码构建到新的本地证据目录：

```text
.local-step141-client-facing-latest-build/dist
```

命令：

```text
corepack pnpm --filter @research-ip/web exec vite build --outDir ../../.local-step141-client-facing-latest-build/dist --emptyOutDir false
```

结果：PASS。

构建输出中的主 JS 文件为：

```text
.local-step141-client-facing-latest-build/dist/assets/index-BuMvpDXh.js
```

而当前 `18081` 运行页面仍引用：

```text
/assets/index-DTUeQ4MR.js
```

因此可以明确看到：当前运行入口不是本次最新构建包。

## 最新构建包扫描结果

证据文件：

```text
.local-step141-client-facing-latest-build/latest-build-text-scan.txt
```

截图中高风险旧文案在最新构建包中的结果：

- `Phase 1 frontend`：0。
- `production auth`：0。
- `GET /`：0。
- `POST /`：0。
- `dryRun=true`：0。
- `Achievement CSV dry-run`：0。
- `Safe preview`：0。
- `Failed to fetch`：0。
- `Network request failed`：0。
- `Custom Reports`：0。
- `Secret Authorization`：0。
- `local/demo`：0。
- `not production`：0。
- `raw JSON`：0。
- `batch mutation`：0。

仍有少量字符串命中，但上下文判断不是普通甲方页面文案：

- `X-Demo-User-Id`：API client 内部请求 header 名称。
- `Candidate`、`Errors`、`Warnings`：主要来自内部变量、类型名或表单错误结构。
- `metadata`：主要来自类型字段、CSS class 或内部权限码。
- `checksum`：来自审计日志安全过滤字段。
- `debug`：来自安全过滤/保护逻辑。
- `session`：来自内部安全过滤或状态逻辑。

这些仍需要在浏览器截图验收中确认不会作为普通页面文案出现。

## 自动化验证

```text
corepack pnpm --filter @research-ip/web typecheck
```

结果：PASS。

```text
corepack pnpm --filter @research-ip/web test -- App Achievement AccountManagement DepartmentManagement SecretAuthorization CustomReports Fees SettingsApiIntegrations
```

结果：PASS，11 files / 226 tests。

## 对冻结的判断

当前还不能冻结，原因是运行入口未刷新。

冻结前 P0 变成：

1. 重建或刷新 `18081` 对应的 Web bundle，让它使用最新构建结果。
2. 重新做真实浏览器逐页截图验收。
3. 如果刷新后的浏览器页面仍展示普通可见英文、接口路径、debug/export/download、
   demo/production 工程标签，再按页面继续改源码。

## 边界

- 本次未修改 `apps/**` 源码。
- 未修改 `prisma/**`、schema 或 migration。
- 未读取 `.env` 或 `.env.production` 内容。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未操作 Docker。
- 未删除、清理或覆盖现有构建目录；构建输出写入新的本地证据目录。
