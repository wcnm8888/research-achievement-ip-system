# Tech Stack - 推荐技术栈

## 推荐方案

| 层级 | 推荐 | 理由 |
| --- | --- | --- |
| 前端 | React + TypeScript + Vite + Ant Design | 适合企业级管理系统，表单、表格、弹窗、布局和反馈组件成熟 |
| 后端 | NestJS + TypeScript | 模块化结构清晰，适合 RBAC、审批、队列、adapter、API 分层 |
| 数据库 | PostgreSQL | 适合关系型核心业务、事务、唯一约束、索引、JSON 字段和审计数据 |
| ORM | Prisma | 类型友好，便于迁移、schema 管理和服务端开发 |
| 搜索 | Meilisearch | 适合基础全文检索和中文/CJK 场景，索引可重建 |
| 队列 | Redis + BullMQ | 用于预警任务、外部接口重试、搜索索引同步 |
| 附件 | S3-compatible storage adapter | 可对接 MinIO、S3 或院内对象存储，业务不绑定具体实现 |
| 测试 | Vitest/Jest + Supertest + Playwright | 覆盖单元、API 集成和浏览器 E2E |
| API 文档 | OpenAPI/Swagger | 便于接口联调、验收和外部 adapter 文档化 |

## 选型原则

- 优先使用成熟框架和事实标准，避免自研通用基础设施。
- 核心业务逻辑与 UI、ORM、外部接口、对象存储解耦。
- 外部系统全部通过 adapter 调用，失败可降级。
- 一期先保证业务闭环和安全边界，二期再深化性能、运维和外部集成。

## 常用命令规划

Step 2 脚手架初始化后，当前环境没有全局 `pnpm`，但 `corepack pnpm` 可用。项目根 `package.json` 已声明 `packageManager: pnpm@9.15.9`，根脚本也显式使用 `corepack pnpm` 调用递归 workspace 命令。

```text
corepack pnpm install
corepack pnpm dev
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm prisma:validate
corepack pnpm exec prisma migrate dev --name init_core_schema
corepack pnpm exec prisma generate
corepack pnpm exec prisma db seed
```

Step 4 权限内核已完成，API 侧测试工具链补充如下：

- 单元测试和 HTTP 集成测试使用 Vitest。
- Nest HTTP 集成测试使用 `@nestjs/testing` 创建测试模块，使用 `supertest` 发起请求并断言 401 / 403 / allow。
- `@types/supertest` 仅用于 TypeScript 类型声明。
- Step 4 最终验证命令：`corepack pnpm --filter @research-ip/api test`、`corepack pnpm --filter @research-ip/api typecheck`、`corepack pnpm --filter @research-ip/api build`、`corepack pnpm lint` 均已通过。
- Step 4 只接入权限内核，不接真实登录/SSO、不接对象存储、不实现运行时业务 API、不读取或记录敏感环境变量内容。

Step 3 已完成一期核心数据库基础：

- Prisma schema：`prisma/schema.prisma`。
- 初始 migration：`prisma/migrations/20260608080155_init_core_schema/migration.sql`。
- Seed：`prisma/seed.cjs`。
- Prisma Client：项目已添加 `@prisma/client@6.19.3`。
- 注意：`package.json#prisma.seed` 在 Prisma 7 会弃用；升级 Prisma 时迁移到 `prisma.config.ts`。

本地开发 PostgreSQL 使用本项目专用 Docker Compose：

- Compose 文件：`docker-compose.dev.yml`。
- 服务名：`research-postgres-dev`。
- 容器名：`research-achievement-postgres-dev`。
- 宿主机端口：`127.0.0.1:55432`。
- Volume：`research_achievement_pgdata_dev`。
- 安全边界：不复用 n8n/content-postgre 容器；不记录数据库密码或完整连接串。

## 环境变量规划

不得在代码、文档或日志中写入真实密钥。仅规划变量名：

```text
DATABASE_URL
REDIS_URL
MEILISEARCH_HOST
MEILISEARCH_API_KEY
STORAGE_ENDPOINT
STORAGE_BUCKET
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
SMTP_HOST
SMTP_USER
SMTP_PASSWORD
DOI_PROVIDER_API_KEY
JWT_SECRET
```

## 外部接口配置原则

- 接口地址、账号、密钥、Token 只能通过环境变量或配置中心引用。
- 后台提供接口开关、超时配置、在线测试和调用日志。
- 调用失败自动重试最多 3 次；失败后记录日志并通知系统管理员。
- 接口异常时启用手工录入降级路径。
- 多数据源返回冲突时保留原始响应摘要和标准化映射结果，不在日志记录敏感凭证。

## 一期技术边界

- 使用本地账号体系或 mock identity adapter 启动，预留 SSO。
- DOI 和邮件先 mock，可替换为真实 provider。
- 搜索索引可重建，不作为业务数据源。
- 对象存储可先本地/MinIO 方案，但业务层只依赖 storage adapter。
- 十万级压测和灾备演练不在一期实现，但 schema、索引和任务设计要为扩展留空间。
