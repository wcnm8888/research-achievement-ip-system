# Step 21

~~~
你现在继续 E:\研究院科研成果管理系统 项目的 Step 20 对话收尾归纳。

当前状态：
- Step 20 plan confirmation：DONE。
- Step 20A：DONE。
- Step 20B：DONE。
- Step 20C：DONE。
- Step 20 overall / Archive：DONE。
- 本轮只做 Step 20 最终收尾归纳，不进入 Step 21。

请只读必要上下文：
1. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 顶部 Step 20 Archive。
2. E:\研究院科研成果管理系统\memory-bank\progress.md 顶部 Step 20 Archive。
3. E:\研究院科研成果管理系统\memory-bank\evidence.md 顶部 Step 20 Archive / Step 20B evidence。
4. E:\研究院科研成果管理系统\memory-bank\decisions.md 顶部 D087。
如果信息已经足够，不要展开无关历史。

收尾归纳必须说明：
- Step 20 已完成什么：系统配置边界 / 只读能力盘点闭环。
- settings 导航不再落到通用 BoundaryPage，而是渲染专属 SettingsBoundary 页面。
- 页面盘点 角色权限、部门、字典、预警规则、接口 adapter 五类一期配置能力。
- 页面明确 system:config 只是权限码 / 未来边界线索，不是 settings/config 后端 API。
- 页面明确不是配置 CRUD，不代表真实配置管理完成。
- 页面无业务 API 请求，无创建/编辑/删除/保存/同步/导入/导出/下载入口。
- 质量证据：
  - corepack pnpm --filter @research-ip/web test：PASS，12 files / 160 tests。
  - corepack pnpm --filter @research-ip/web typecheck：PASS。
  - corepack pnpm --filter @research-ip/web build：PASS，保留既有 Vite large chunk warning。
  - corepack pnpm lint：PASS。
- 浏览器/API 边界证据：
  - settings 页面显示“系统配置边界 / 只读能力盘点”、“当前不是配置管理实现”、“NO API”、“system:config”。
  - 桌面 requests=[]、consoleErrors=[]、pageErrors=[]。
  - 无创建/编辑/删除/保存/同步/导入/导出/下载入口。
  - 390px requests=[]，无 action entries，body/doc/client/inner=390，overflow=false。
- 明确执行产物：
  - apps/web/dist/** 由 Step 20B build 刷新。
  - .playwright-cli/** 包含 Step 20B 浏览器诊断产物。
  - memory-bank/step20b-web-dev.*.log 记录临时 dev server 输出。
  - 不清理、不删除、不移动这些产物。
- 明确边界：
  - 不包含真实 settings/config API。
  - 不包含角色、部门、字典、预警规则、接口配置 CRUD。
  - 不包含真实 SSO、外部接口、对象存储、Meilisearch。
  - 不包含附件 upload/download/detail、费用凭证附件、warnings API、search_logs。
  - 不包含 Step 14 DataGap、Step 15 真实费用写入、seed、migrate、data backfill、data cleanup。
- 残余风险：
  - Step 20 是配置边界 / 能力盘点闭环，不证明或实现真实配置管理能力。

输出要求：
- 直接给 Step 20 最终收尾回复。
- 不修改文件。
- 不运行门禁。
- 不启动前端。
- 不进入 Step 21。
- 不生成 Step 21 计划。
~~~



## Step 21A

~~~
你现在继续 E:\研究院科研成果管理系统 项目的 Prompt 18 编排对话。

本轮只做 Step 21 计划确认复核，不执行 Step 21A。

已知 Step 21 计划确认输出建议：
- Step 21 推荐方向：附件 detail metadata readonly frontend closure。
- 任务分类：M。
- 拆分为：
  - Step 21A：附件 detail metadata 前端只读实现。
  - Step 21B：质量门禁与浏览器/API 边界验收。
  - Step 21C：memory-bank 归档与 Step 21 closure。
- 明确不包含 upload/download/object storage/费用附件/warnings/search_logs/Meilisearch/settings/config/Step 14 DataGap/Step 15 真实写入/seed/migrate/data cleanup。

请你只做计划确认判断：
1. 是否接受 Step 21 选择“附件 detail metadata readonly frontend closure”。
2. 是否接受 Step 21A/21B/21C 的拆分。
3. 是否需要把 Step 18 audit live readonly smoke 或 Step 19 attachment metadata live readonly smoke 改为优先方向。
4. 是否需要调整 Step 21A 范围、验证方式或禁止边界。

请输出最终选择：
- ACCEPT：接受该 Step 21 计划，下一轮生成 Step 21A 执行 Prompt。
- ADJUST：说明要调整的方向或边界。
- HOLD：暂不进入 Step 21，等待重新选择路线。

本轮不要实现功能、不要修改文件、不要运行 test/build/lint、不要启动浏览器。
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 21A。

当前状态：
- Step 21 plan confirmation: DONE / ACCEPT。
- Step 21 方向：附件 detail metadata readonly frontend closure。
- Step 21A：NOT_STARTED。
- Step 21B：NOT_STARTED。
- Step 21C：NOT_STARTED。

本轮目标：
实现“附件 detail metadata 前端只读基础能力”。

严格边界：
- 只使用已有 GET /achievements/:achievementId/attachments/:attachmentId。
- 不修改 apps/api/**。
- 不新增后端 API、schema、migration、seed、permission seed。
- 不做 upload/download/object storage。
- 不调用 /download。
- 不做费用凭证附件。
- 不做 warnings API、search_logs、Meilisearch、settings/config。
- 不做 Step 14 DataGap、Step 15 真实写入。
- 不做 seed/migrate/data cleanup。
- 不读 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不启动浏览器；浏览器/API 边界验收留给 Step 21B。

允许修改范围：
- apps/web/src/AchievementDetail.tsx
- apps/web/src/AchievementDetail.test.ts
- apps/web/src/types.ts
- apps/web/src/App.css
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md 中 Step 21A 状态小节
- 如新增边界决策，可在 memory-bank/decisions.md 新增 D088
- 如确需修改其他文件，先说明原因并确保直接服务 Step 21A。

执行要求：
1. 只读必要上下文：
   - E:\Vibe coding\AGENTS.md
   - E:\Vibe coding\vibe-methodology\00-operating-protocol.md
   - E:\Vibe coding\vibe-methodology\01-task-classification.md
   - E:\Vibe coding\vibe-methodology\08-quality-gates.md
   - memory-bank 顶部 Step 20 Archive、Step 21 plan confirmation 或最新状态
   - apps/web/src/AchievementDetail.tsx
   - apps/web/src/AchievementDetail.test.ts
   - apps/web/src/types.ts
2. 先复核现有附件 list metadata 前端实现，确认 detail metadata 应如何接入，不展开无关历史。
3. 增加 detail metadata 只读请求封装或状态逻辑：
   - 请求路径必须是 GET /achievements/:achievementId/attachments/:attachmentId。
   - no-demo-user 时不得发 detail 请求。
   - 只在用户明确打开/查看某个附件详情时发起 detail 请求。
4. 增加只读 UI：
   - 展示安全 metadata 字段。
   - 不展示 storageKey、checksum、对象存储路径、文件内容、下载链接或真实路径。
   - 提供 loading、success、empty/缺失、403、404、500、network 状态。
   - 不出现上传、下载、删除、归档、版本变更、保存、同步、导入、导出入口。
5. 增加或更新测试，至少覆盖：
   - detail 请求路径和 GET-only。
   - no-demo-user no-request。
   - success 只展示安全 metadata。
   - 403/404/500/network 错误映射。
   - 不出现 /download、POST、PATCH、DELETE、upload/download/delete/archive/version-change entry。
   - 不展示 storageKey、checksum、object body/raw storage path。
6. 运行 Step 21A 最小验证：
   - 优先运行相关 web test。
   - 如合理，再运行 web typecheck。
   - 不运行浏览器验收，不跑 Step 21B 范围。
7. 更新 memory-bank 中 Step 21A 的进度和证据：
   - 记录改动范围。
   - 记录运行的验证命令和结果。
   - 记录未覆盖范围和残余风险。
   - 不把 Step 21 overall 标成 DONE。

最终输出：
- 改了哪些文件。
- Step 21A 实现了什么。
- 验证命令与结果。
- 明确说明没有越界到 upload/download/object storage/write/data cleanup。
- 状态：
  - Step 21 plan confirmation: DONE
  - Step 21A: DONE / NOT DONE
  - Step 21B: NOT_STARTED
  - Step 21C: NOT_STARTED
- 停在 Step 21A，不生成 Step 21B 执行结果。
~~~

## Step 21B

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 21B 执行。

当前状态：
- Step 21 plan confirmation: DONE / ACCEPT。
- Step 21A: DONE。
- Step 21B plan confirmation: DONE。
- Step 21B execution: NOT_STARTED。
- Step 21C: NOT_STARTED。

本轮目标：
执行 Step 21B 质量门禁与浏览器/API 边界验收，验证 Step 21A 的附件 detail metadata readonly frontend foundation 是否闭环。

严格边界：
- 不归档 Step 21 overall。
- 不进入 Step 21C。
- 不新增功能。
- 不修改 apps/api/**。
- 不新增后端 API、schema、migration、seed、permission seed。
- 不做 upload/download/object storage。
- 不调用 /download。
- 不做费用凭证附件。
- 不做 warnings API、search_logs、Meilisearch、settings/config。
- 不做 Step 14 DataGap、Step 15 真实写入。
- 不做 seed/migrate/data cleanup。
- 不读 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

允许最小修复范围：
仅当门禁或浏览器验收发现 Step 21A 前端直接相关缺陷时，允许最小修改：
- apps/web/src/AchievementDetail.tsx
- apps/web/src/AchievementDetail.test.ts
- apps/web/src/types.ts
- apps/web/src/App.css
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md

不允许扩大功能范围，不允许改 apps/api/**。

只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\08-quality-gates.md
4. memory-bank 顶部 Step 21A、Step 21B plan confirmation、D088
5. apps/web/src/AchievementDetail.tsx
6. apps/web/src/AchievementDetail.test.ts
7. apps/web/src/types.ts
8. apps/web/src/App.css
9. 如需定位导航/打开详情路径，可只读 apps/web/src/App.tsx 相关小范围。

质量门禁：
1. 运行 `corepack pnpm --filter @research-ip/web test -- AchievementDetail`
2. 运行 `corepack pnpm --filter @research-ip/web typecheck`
3. 运行 `corepack pnpm --filter @research-ip/web build`
4. 运行 `corepack pnpm lint`

失败处理：
- 若失败是 Step 21A 前端直接相关缺陷，做最小修复并重跑相关失败门禁。
- 若失败来自无关历史问题，记录为非本 Step 风险，不顺手重构。
- 若失败指向后端、schema、seed、配置或高风险路线，停止并回报。

浏览器/API 边界验收：
- 启动临时前端 dev server，验收后停止。
- 优先使用 Playwright/browser route mock 构造 achievement list/detail、attachment list、attachment detail success/403/404/500/network 场景。
- 明确记录：mock 验收是前端/API 边界验收，不是 live backend/database smoke。

验收场景：
1. no-demo-user no-request
   - 清空 demo user。
   - 进入成果详情相关页面。
   - 确认不发 `/attachments` 或 attachment detail metadata 请求。
2. demo-user success
   - 设置 demo user。
   - 打开成果详情。
   - mock 附件列表显示 metadata。
   - 确认点击“查看 metadata 详情”之前不发 detail 请求。
   - 点击后只发 `GET /api/achievements/:achievementId/attachments/:attachmentId`。
   - 页面只展示安全 metadata 字段。
3. detail error states
   - mock 403，确认显示权限错误。
   - mock 404，确认显示不存在/不可用。
   - mock 500 或 network failure，确认显示服务不可用/可重试状态。
4. 请求扫描
   - 无 POST/PATCH/DELETE。
   - 无 `/download`。
   - 无 `/fees/warnings`。
   - 无 `search_logs`。
   - 无 Meilisearch / 外部搜索请求。
   - 无 settings/config 请求。
5. 入口扫描
   - 无上传、下载、删除、归档、版本变更、保存、同步、导入、导出入口。
6. 响应式
   - 至少检查 390px。
   - 记录 body/doc/client/inner 宽度和 overflow。
7. 控制台
   - 记录 consoleErrors 和 pageErrors。
   - intentional mocked 4xx 如产生资源错误，单独标注为预期 mock 结果。

memory-bank 更新：
- 更新 implementation-plan.md 顶部 Step 21B 状态小节。
- 更新 progress.md 顶部 Step 21B 结果。
- 更新 evidence.md 顶部 Step 21B 证据。
- 不归档 Step 21 overall。
- 不把 Step 21C 标成 DONE。
- decisions.md 通常不需要新增，除非发现必须记录的新边界决策。

最终输出：
- Step 21B 是否 DONE。
- 命令门禁结果。
- 浏览器/API 边界验收结果。
- 是否做了最小修复；如有，列出文件和原因。
- 未覆盖范围和残余风险。
- 明确未越界。
- 状态：
  - Step 21 plan confirmation: DONE
  - Step 21A: DONE
  - Step 21B plan confirmation: DONE
  - Step 21B execution: DONE / NOT DONE
  - Step 21C: NOT_STARTED
- 停在 Step 21B，不生成 Step 21C 执行结果。
~~~

## Step 21C

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 21C 计划确认。

本轮只做 Step 21C 计划确认：
- 不修改项目文件。
- 不运行 test/typecheck/build/lint。
- 不启动前端或浏览器。
- 不发业务请求。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不归档执行，只确认归档计划。

当前状态：
- Step 21 plan confirmation: DONE / ACCEPT。
- Step 21A: DONE，附件 detail metadata 前端只读基础能力完成。
- Step 21B plan confirmation: DONE。
- Step 21B execution: DONE，质量门禁与浏览器/API 边界验收完成。
- Step 21C: NOT_STARTED。

Step 21B 已知证据：
- `corepack pnpm --filter @research-ip/web test -- AchievementDetail`: PASS，1 file / 24 tests。
- `corepack pnpm --filter @research-ip/web typecheck`: PASS。
- `corepack pnpm --filter @research-ip/web build`: PASS，仅既有 Vite large chunk warning。
- `corepack pnpm lint`: PASS。
- Browser/API route-mock acceptance 通过：
  - no-demo-user：apiRequestCount=0，attachmentRequestCount=0。
  - demo-user success：点击“查看 metadata 详情”前 detail request count=0；点击后仅 GET detail。
  - 403/404/500 状态有对应只读错误展示。
  - 无 POST/PATCH/DELETE、无 /download、无 /fees/warnings、无 search_logs、无 Meilisearch、无 settings/config。
  - 无 upload/download/delete/archive/version-change/save/sync/import/export 入口。
  - 390px 无横向 overflow。
  - unexpected console errors 和 pageErrors 为空；mock 4xx/5xx 资源错误为预期。
- Step 21B 未做 live backend/database smoke。
- Step 21B 未做产品前端修复，仅更新 memory-bank 和 browser acceptance script artifact。

请只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\08-quality-gates.md
4. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 顶部 Step 21B 与 Step 21A 小范围
5. E:\研究院科研成果管理系统\memory-bank\progress.md 顶部 Step 21B 与 Step 21A 小范围
6. E:\研究院科研成果管理系统\memory-bank\evidence.md 顶部 Step 21B 与 Step 21A 小范围
7. E:\研究院科研成果管理系统\memory-bank\decisions.md 顶部 D088

请输出 Step 21C 计划确认：
1. 当前状态复核。
2. 判断 Step 21A + Step 21B 是否足以进入 Step 21 overall Archive。
3. Step 21C 目标：
   - 归档 Step 21 overall 为附件 detail metadata readonly frontend closure。
   - 汇总 Step 21A 实现和 Step 21B 证据。
   - 明确 Step 21 是只读附件 detail metadata 前端闭环，不是完整附件管理。
4. Step 21C 非目标：
   - 不新增功能。
   - 不修改 apps/api/** 或 apps/web/** 产品代码。
   - 不重跑门禁，除非发现记录冲突。
   - 不做 live backend/database smoke。
   - 不做 upload/download/object storage。
   - 不做费用凭证附件。
   - 不做 warnings API、search_logs、Meilisearch、settings/config。
   - 不做 Step 14 DataGap、Step 15 真实写入。
   - 不做 seed/migrate/data cleanup。
5. Step 21C 拟更新文件：
   - memory-bank/implementation-plan.md
   - memory-bank/progress.md
   - memory-bank/evidence.md
   - memory-bank/decisions.md 是否需要新增/更新：默认不需要，除非归档决策需新增 D089。
6. Step 21C 归档内容计划：
   - completed capability。
   - boundary。
   - verification basis。
   - execution artifacts。
   - residual risk。
   - next。
7. 是否复用 Step 21B 证据、不重跑门禁的理由。
8. 风险与阻塞条件：
   - 若 Step 21A/B 记录冲突，Step 21C NOT DONE。
   - 若证据不足以证明 GET-only、no-demo-user no-request 或无 /download，则 Step 21C NOT DONE。
   - live backend/database smoke 缺失是否作为 residual risk，而非阻塞。
9. 最终状态：
   - Step 21C plan confirmation: DONE / NOT DONE
   - Step 21C execution: NOT_STARTED
   - Step 21 overall / Archive: NOT_STARTED

本轮停止在 Step 21C 计划确认，不执行归档。
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 21C 执行。

当前状态：
- Step 21 plan confirmation: DONE / ACCEPT。
- Step 21A: DONE。
- Step 21B plan confirmation: DONE。
- Step 21B execution: DONE。
- Step 21C plan confirmation: DONE。
- Step 21C execution: NOT_STARTED。
- Step 21 overall / Archive: NOT_STARTED。

本轮目标：
执行 Step 21C 文档归档，将 Step 21 overall 归档为：
attachment detail metadata readonly frontend closure。

本轮只做归档：
- 汇总 Step 21A 实现。
- 汇总 Step 21B 质量门禁与浏览器/API 边界证据。
- 明确 Step 21 是只读附件 detail metadata 前端闭环，不是完整附件管理。
- 记录 residual risk 和 next。
- 不新增功能。

严格边界：
- 不修改 apps/api/**。
- 不修改 apps/web/** 产品代码。
- 不新增后端 API、schema、migration、seed、permission seed。
- 不重跑 test/typecheck/build/lint，除非发现 Step 21A/B 记录冲突。
- 不启动前端或浏览器。
- 不发业务请求。
- 不做 live backend/database smoke。
- 不做 upload/download/object storage。
- 不调用 /download。
- 不做费用凭证附件。
- 不做 warnings API、search_logs、Meilisearch、settings/config。
- 不做 Step 14 DataGap、Step 15 真实写入。
- 不做 seed/migrate/data cleanup。
- 不读 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\08-quality-gates.md
4. memory-bank/implementation-plan.md 顶部 Step 21B 与 Step 21A 小范围
5. memory-bank/progress.md 顶部 Step 21B 与 Step 21A 小范围
6. memory-bank/evidence.md 顶部 Step 21B 与 Step 21A 小范围
7. memory-bank/decisions.md 顶部 D088

允许修改文件：
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md 仅在确需新增归档决策时修改；默认不新增 D089。

归档要求：
1. 在 implementation-plan.md 顶部新增或更新 Step 21 Archive：
   - Step 21 plan confirmation: DONE / ACCEPT。
   - Step 21A: DONE。
   - Step 21B: DONE。
   - Step 21C: DONE。
   - Step 21 overall / Archive: DONE。
   - Archive scope。
   - Completed capability。
   - Boundary。
   - Verification basis。
   - Execution artifacts。
   - Known residual risk。
   - Next。
2. 在 progress.md 顶部新增 Step 21 Archive：
   - Status: DONE。
   - Archived capability。
   - Verification basis。
   - Archive execution。
   - Boundaries。
   - Artifact notes。
   - Residual risk。
   - Next。
3. 在 evidence.md 顶部新增 Step 21 Archive evidence：
   - Purpose。
   - Archive status。
   - Step 21A implementation evidence reused。
   - Step 21B gate evidence reused。
   - Step 21B browser/API boundary evidence reused。
   - Step 21C verification：说明本轮未重跑门禁，因为只更新 memory-bank 且复用 Step 21B 证据。
   - Artifact record。
   - Boundary evidence。
   - Residual risk。
4. decisions.md：
   - 默认复用 D088。
   - 只有当归档产生新的长期决策时，才新增 D089。
   - 不为了形式新增决策。

必须明确写入的能力结论：
- 前端支持附件 detail metadata 只读查看。
- 复用已有 `GET /achievements/:achievementId/attachments/:attachmentId`。
- detail metadata 只在用户点击“查看 metadata 详情”后请求。
- no-demo-user / missing achievement ID / missing attachment ID 不发 detail 请求。
- 显示安全 metadata 字段。
- 不展示 storageKey、checksum、object body、download URL、raw storage path。
- 无上传、下载、删除、归档、版本变更、保存、同步、导入、导出入口。
- 无 POST/PATCH/DELETE。
- 无 `/download`、`/fees/warnings`、`search_logs`、Meilisearch、settings/config 请求。
- 390px 无横向 overflow。

必须明确写入的非目标：
- Step 21 不是完整附件管理。
- 不包含 upload/download/object storage。
- 不包含费用凭证附件。
- 不包含 live backend/database smoke。
- 不包含 warnings API、search_logs、Meilisearch、settings/config。
- 不包含 Step 14 DataGap、Step 15 真实写入。
- 不包含 seed/migrate/data cleanup。

验证依据：
- `corepack pnpm --filter @research-ip/web test -- AchievementDetail`: PASS，1 file / 24 tests。
- `corepack pnpm --filter @research-ip/web typecheck`: PASS。
- `corepack pnpm --filter @research-ip/web build`: PASS，仅既有 Vite large chunk warning。
- `corepack pnpm lint`: PASS。
- Step 21B route-mock browser/API acceptance 全部通过。
- Step 21C 不重跑门禁，原因是归档文档步骤且不改产品代码。

执行后输出：
- 修改了哪些 memory-bank 文件。
- 是否新增 D089；如未新增，说明复用 D088。
- Step 21 overall / Archive 是否 DONE。
- 未运行门禁的原因。
- 残余风险。
- 状态：
  - Step 21 plan confirmation: DONE
  - Step 21A: DONE
  - Step 21B: DONE
  - Step 21C: DONE / NOT DONE
  - Step 21 overall / Archive: DONE / NOT DONE
- 停在 Step 21C，不生成 Step 22 计划。
~~~

