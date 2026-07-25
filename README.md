# 研究院科研成果管理系统

项目仓库或项目工作区

本目录是项目唯一的当前工作树。项目源码、配置、测试和持续维护文档按职责分区；阶段一的原始过程记录、提示词、截图、日志和交付物已迁入本地阶段档案。

## 目录

~~~
E:\研究院科研成果管理系统
├─ apps/        应用代码：API、Web
├─ packages/    共享代码包
├─ prisma/      数据库 Schema、迁移、种子数据
├─ tests/       可复用测试和验收脚本
├─ docs/        项目长期文档
├─ deploy/      部署配置和部署验证材料
├─ scripts/     开发辅助脚本
├─ AGENTS.md    AI 与项目开发规则
├─ README.md    项目入口说明
├─ .env*        环境变量模板或本地环境文件
└─ docker-compose*.yml
               不同环境的服务编排配置
~~~



## 常用门禁

```powershell
corepack pnpm -r test
corepack pnpm -r typecheck
git diff --check
```

## 安全边界

- `.env`、`.env.production` 等本地配置不得读取、输出或提交。
- 生产、VPS、数据库和账号操作需要单独授权。
- 阶段历史不再堆放在项目根目录；入口见 `docs/project-management/README.md`。
