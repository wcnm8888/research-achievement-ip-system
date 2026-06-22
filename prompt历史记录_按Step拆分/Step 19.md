# 19、Step 19

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 19 计划确认。

本轮只做计划确认：
- 不实现功能。
- 不修改项目文件。
- 不运行 test / typecheck / build / lint。
- 不启动前端。
- 不发起业务请求或写请求。
- 不读取 `.env`、密钥、Token、Cookie、证书、私钥。
- 只读必要上下文，重新判断 Step 19 应优先选择的一期剩余方向。

当前状态：
- Step 16 overall / Archive：DONE，readonly search center frontend completion。
- Step 17 overall / Archive：DONE，readonly dashboard frontend completion。
- Step 18 overall / Archive：DONE_WITH_MOCK_BROWSER_RISK，masked readonly audit-log closure。
- Step 18 dialogue wrap-up：DONE。
- D082 / D083 / D084 已记录。
- Step 19 尚未开始。

Step 18 已完成：
- 后端 `GET /audit-logs` masked readonly API。
- 前端 AuditLogs masked readonly 页面。
- `audit` 导航从 BoundaryPage 接入真实页面。
- 明确不包含完整审计平台、导出、下载、unmasked、审计分析。
- 残余风险：Step 18B 浏览器 success / 403 使用 Playwright route mock，不是 live backend/database dataset。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md` 顶部 Step 18 Archive 状态
6. `E:\研究院科研成果管理系统\memory-bank\progress.md` 顶部 Step 18 收尾结果
7. `E:\研究院科研成果管理系统\memory-bank\evidence.md` 顶部 Step 18 证据
8. `E:\研究院科研成果管理系统\memory-bank\decisions.md` 顶部 D084
9. `product-brief.md`、`feature-brief.md`、`design-spec.md` 中一期剩余范围相关小节
10. `apps/web/src/App.tsx` 当前导航、已实现页面、占位页面
11. 如需确认候选方向，只读对应小范围契约，不展开无关历史。

请比较 Step 19 候选方向：
- 系统配置边界页 / 配置能力。
- 附件相关路线。
- Step 14 DataGap 收敛。
- Step 15 真实费用写入验收。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- search_logs 写入。
- Meilisearch / 外部搜索引擎同步。
- 数组 targetTypes / api-client 数组 query 扩展。
- 其他一期剩余明确缺口。

重点判断：
- 哪些方向已有后端契约、适合低风险闭环。
- 哪些方向涉及真实写请求、数据保留、seed/migrate/data cleanup，必须用户显式确认。
- 哪些方向只是边界页，不应伪造成已实现能力。
- Step 19 是否应继续优先低风险只读闭环，还是必须进入高风险遗留路线。
- 不得把 Step 14 DataGap、Step 15 真实写入、附件、系统配置、warnings、search_logs、Meilisearch 自动混在一个 Step。

请输出：
1. 当前状态复核。
2. 一期剩余范围证据摘要。
3. 候选方向比较。
4. Step 19 推荐方向与依据。
5. 任务分类 XS/S/M/L，并说明原因。
6. Step 19 目标、非目标、成功标准。
7. 建议拆分子步骤，例如 Step 19A / 19B / 19C，但只给计划，不执行。
8. 每个子步骤的文件范围、验证方式、浏览器/API 验收思路和风险。
9. memory-bank 更新建议。
10. 最终结论：`Step 19 plan confirmation: DONE / NOT DONE`。

本轮停止在计划确认，不要实现，不要生成执行 Prompt。
~~~

