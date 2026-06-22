# Step 22

Step 22A

~~~
你现在进入 E:\研究院科研成果管理系统 项目的 Step 22A。

Step 22 已确认方向：
- Step 22 选择 `Step 18 audit live readonly smoke` 补证闭环。
- 目标是补 Step 18 的 `DONE_WITH_MOCK_BROWSER_RISK` 残余风险。
- Step 22 不是新功能，不是完整审计平台，不修改源码，不扩展 API。

本轮 Step 22A 定位：
- 只做 live readonly smoke 的 scope / preflight。
- 不执行 live smoke。
- 不启动前端、后端、浏览器或数据库。
- 不发业务请求。
- 不运行 test/typecheck/build/lint。
- 不修改项目文件。
- 不读取 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。
- 不 seed、不 migrate、不造数据、不清理数据。
- 不进入 Step 22B 或 Step 22C。

请只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 顶部 Step 21 Archive、Step 20 Archive，必要时 Step 18 Archive 小范围
6. E:\研究院科研成果管理系统\memory-bank\progress.md 顶部 Step 21 Archive、Step 20 Archive，必要时 Step 18 Archive 小范围
7. E:\研究院科研成果管理系统\memory-bank\evidence.md 顶部 Step 21 Archive、Step 20 Archive，必要时 Step 18 Archive 小范围
8. E:\研究院科研成果管理系统\memory-bank\decisions.md 顶部 D088、D087，必要时 D084
9. 必要时只读 audit 相关小范围契约或代码，用于确认 `GET /audit-logs`、masked 字段、权限和前端 audit 页面边界；不要展开无关历史。

Step 22A 需要确认：
1. Step 18 当前状态是否仍是 `DONE_WITH_MOCK_BROWSER_RISK`。
2. Step 22A 是否只应作为 Step 18 live readonly smoke 的执行前检查。
3. Step 22B 允许的请求范围是否只能是：
   - `GET /api/health`
   - `GET /api/audit-logs?take=50`
4. Step 22B 不允许出现：
   - POST / PATCH / DELETE
   - export / download
   - unmasked audit read
   - raw JSON copy
   - audit analytics
   - settings/config
   - attachments
   - fee writes
   - warnings API
   - search_logs write
   - Meilisearch/external sync
   - seed / migrate / data backfill / data cleanup
5. Step 22B 的阻塞条件：
   - 没有用户明确批准的 live backend URL。
   - 没有用户明确批准或项目已有的 demo user context。
   - 需要读取 `.env`、完整连接串、Token、Cookie 或凭证。
   - 需要 seed/migrate/import/创建 audit 数据。
   - 需要写入业务数据或制造 audit log。
6. Step 22B 的证据要求：
   - 记录请求方法和 path。
   - 记录 HTTP status。
   - 记录响应是否为 masked readonly shape。
   - 记录是否出现 raw `oldValue`、`newValue`、`ipAddress`、`userAgent` 等敏感字段。
   - 记录是否有 POST/PATCH/DELETE 或 forbidden request。
   - 如使用浏览器验收，必须记录无 export/download/unmasked/raw-copy 入口。
7. 重要限制：
   - 如果 `GET /api/audit-logs?take=50` 返回空列表，只能证明 endpoint/status/schema/GET-only/权限边界。
   - 空列表不能证明真实行级 masked 字段已经通过验证。
   - 空列表必须记录为 partial smoke residual risk，不能写成完整 masked 行级验证通过。

请输出 Step 22A 结果，必须包含：
1. 当前状态复核。
2. Step 22A scope/preflight 判断。
3. Step 22B 允许请求与禁止请求清单。
4. Step 22B 执行前必须由用户确认的信息。
5. Step 22B 验收证据清单。
6. 空列表情况下的证据限制说明。
7. 风险与阻塞条件。
8. 是否建议进入 Step 22B。
9. 最终状态：
   - Step 22 plan confirmation: DONE
   - Step 22A: DONE 或 BLOCKED
   - Step 22B: NOT_STARTED
   - Step 22C: NOT_STARTED

本轮停止在 Step 22A：
- 不执行 live smoke。
- 不修改文件。
- 不运行门禁。
- 不生成 Step 22B 执行结果。
~~~



Step 22B

