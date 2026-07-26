# 当前技术栈与运行边界

更新时间：2026-07-26

本文档只描述当前仓库真实使用的技术和可验证边界，不把依赖安装、Schema 模型或历史设计意图表述为生产能力。

## 工作区

| 层 | 当前技术 | 主要职责 |
| --- | --- | --- |
| 包管理 | pnpm / Corepack | 管理 monorepo 依赖和脚本 |
| Web | React 18、TypeScript、Vite、Ant Design、Vitest | 单页应用、页面组件、表单和状态展示 |
| API | NestJS 10、TypeScript、Vitest、Supertest | HTTP API、认证、授权和业务模块 |
| Shared | TypeScript | 前后端共享类型、DTO、枚举和常量 |
| 数据库 | PostgreSQL、Prisma 6 | Schema、查询和持久化边界 |
| 浏览器验收 | Playwright CLI 脚本 | 本地页面操作和验收证据 |

## 当前目录职责

- `apps/web`：React 页面、组件、前端 API client 和 UI 状态。
- `apps/api`：NestJS 模块、Controller、Service、认证授权、数据库访问和适配器。
- `packages/shared`：跨包共享的类型和业务约定。
- `prisma`：当前 Schema 和数据库相关脚本入口。
- `tests/acceptance`：可复用本地验收脚本，不等于生产验收环境。
- `docs`：当前长期维护的架构、设计、需求和项目管理文档。

## 数据访问与模块化

API 采用模块化单体，而不是当前已拆分的微服务。Controller 处理 HTTP 协议，guard/policy 处理身份和资源授权，Service 处理业务编排，Prisma 处理数据库访问。模块间通过 NestJS provider、共享类型和明确的业务边界协作。

当前数据库模型覆盖身份、组织、RBAC、成果、流程、费用、提醒、附件、审计、报表、搜索、外部调用和导入。模型存在只说明应用和 Schema 有相应表达，不说明生产数据或外部系统已接通。

## 认证与环境模式

- 本地开发和 demo 使用 synthetic 身份/数据，重点是页面与权限流程演示。
- 生产构建使用登录和会话获取当前身份的路径，不应依赖 demo 身份控件。
- 当前没有完成真实 HR/SSO 接入、生产身份生命周期、部署环境安全配置和外部身份验收。

## 外部依赖

真实邮件、短信、财务、文献、专利、DOI、HR/SSO、对象存储和生产数据库不属于当前已验收范围。fake/mock/in-memory adapter 只能验证应用边界、编排和失败处理，不能替代真实连接验收。

## 本地质量门禁

当前基线使用以下检查：

```text
corepack pnpm -r test
corepack pnpm -r typecheck
corepack pnpm -r build
corepack pnpm lint
git diff --check
```

最近基线中测试、typecheck、build、lint 均通过；build 仍报告 Web 产物存在大 bundle 警告（约 1.5 MB 的压缩 JS chunk 高于 Vite 默认 500 kB 提示阈值）。该警告不在本 Step 修复。

## 当前技术风险

- Web 尚无正式路由和全局数据请求/缓存策略。
- 浏览器视觉验收尚未形成桌面、平板、移动端基线证据。
- 生产身份、外部服务、生产数据库和部署链路未完成真实验收。
- 大 bundle 警告需要后续性能专项。

## 阶段六基线评审结论

当前技术栈和运行边界已完成文档层面复核，可作为后续任务卡的技术基线。正式路由、全局请求/缓存策略、真实身份接入、外部服务、生产数据库和部署链路均保持为未决或未验收事项，不因技术栈文档存在而被视为完成。
