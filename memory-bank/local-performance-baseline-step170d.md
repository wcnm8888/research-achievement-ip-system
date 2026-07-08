# Step170D 性能验收本地基线 MVP

## 范围定位

本 Step 面向“研究院科研成果与知识产权管理系统 local-demo / local Docker production-like 评审提交版”，补强性能验收相关需求的本地基线证据。

本 Step 不代表生产环境性能验收、50 并发正式压测或十万级数据压测已经完成。

## 本地基线目标

- 检索接口：本地基线尽量小于 1 秒。
- 统计看板接口：本地基线尽量小于 3 秒。
- 普通页面入口：本地基线尽量小于 2 秒。
- 50 并发：只做本地 GET 轻量并发预演，生产待验收。
- 十万级数据：记录能力说明，生产专项待验收。

## 脚本

新增脚本：

```bash
node scripts/local-performance-baseline-step170d.mjs
```

脚本默认只访问本地入口：

```text
http://127.0.0.1:18081/
```

脚本采样对象：

- 普通页面入口：`/`
- 统计看板接口：`/api/dashboard/summary?dueSoonDays=30`
- 检索接口：`/api/search?keyword=成果&take=20`
- 成果台账接口：`/api/achievements?page=1&pageSize=20`
- 自定义报表模板接口：`/api/reports/templates`
- 检索接口 50 并发轻量预演：`/api/search?keyword=成果&take=20`

脚本只发起 GET 请求，不写入数据库，不创建业务数据，不调用外部系统。

运行产物默认写入：

```text
.local-step170d-performance/
```

该目录为本地验收产物，默认不提交。

## 验收输出字段

脚本输出并保存：

- endpoint label
- mode：sequential / concurrent
- status codes
- p50
- p95
- max
- target
- PASS / CHECK

## 需求覆盖影响

- 检索响应小于 1 秒：补强为本地基线 MVP / 生产待验收。
- 看板响应小于 3 秒：补强为本地基线 MVP / 生产待验收。
- 普通页面响应小于 2 秒：补强为本地基线 MVP / 生产待验收。
- 50 并发：补强为本地轻量并发预演 / 生产待验收。
- 十万级数据压测：仍为生产专项待验收，不宣称完成。

## 验证记录

已执行：

- `node scripts/local-performance-baseline-step170d.mjs`
  - 普通页面入口：`status=200`，`p50=2.54ms`，`p95=3.62ms`，`max=3.62ms`，本地目标 2 秒内，结果 PASS。
  - 统计看板接口：`status=401`，被本地 production-like 认证边界拦截，结果 CHECK。
  - 检索接口：`status=401`，被本地 production-like 认证边界拦截，结果 CHECK。
  - 成果台账接口：`status=401`，被本地 production-like 认证边界拦截，结果 CHECK。
  - 自定义报表模板接口：`status=401`，被本地 production-like 认证边界拦截，结果 CHECK。
  - 检索接口 50 并发轻量预演：`status=401`，认证边界响应 `p95=55.07ms`，结果 CHECK。
  - 报告产物：`.local-step170d-performance/local-performance-baseline-2026-07-08T07-56-31-579Z.json`

待执行：

- `git diff --check`
- `git diff --cached --check`

如果后续只提交文档和脚本，不需要运行前后端全量测试或 typecheck。

## 结果解释

本地普通页面入口已形成可复跑基线。API 请求在当前 `http://127.0.0.1:18081/` production-like 入口下被认证边界拦截，脚本不读取浏览器 Cookie、不读取密码、不读取密钥，因此不能绕过认证继续测业务接口。

这次结果可用于说明：

- 本地性能验收脚本和报告格式已具备。
- 本地入口静态页面响应满足提交版基线。
- 认证 API 的业务性能仍需在合法认证会话或生产专项环境中复测。
- 不可把 API 的 401 响应耗时写成业务接口达标。

## 安全边界

- 未读取 `.env`、`.env.production`、密钥、Token、Cookie、密码或连接串。
- 未访问 production、VPS 或生产数据库。
- 未调用真实邮件、短信、企微或其他外部通知服务。
- 未做破坏性压测。
- 未执行写入请求或大量造数。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore`、`git clean`。
- 未执行 `docker system prune` 或 `docker volume prune`。
- 未触碰既有 `.local-step*`、`.learnings`、`apps/api/deploy`、`local-prod-preview-proxy.cjs`。
