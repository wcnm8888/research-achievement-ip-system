~~~~
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
~~~~

