# 项目文档

- `overview/`：项目说明和下一阶段入口。
- `requirements/`：产品目标、功能范围和需求覆盖。
- `design/`：交互与界面设计规格。
- `architecture/`：系统架构、技术栈和关键契约；当前数据模型和安全边界先作为 `architecture.md` 章节维护，避免产生双权威。
- `testing/`：当前测试策略。
- `operations/`：部署、备份、恢复、生产就绪和安全运行手册，属于长期运行资产，不等同于阶段过程记录。
- `project-management/`：路线图、当前任务、阶段计划、进度、决策和证据入口。

项目管理入口：

- `project-management/roadmap.md`：六阶段路线和 Route B/C/D 边界。
- `project-management/current-task.md`：当前唯一任务；没有功能任务时明确记录为空。
- `project-management/implementation-plan.md`：当前阶段的执行顺序。
- `project-management/progress.md`：最近状态摘要。
- `project-management/evidence.md`：验证结果和风险摘要。
- `project-management/decisions.md`：当前有效决策索引。

阶段一原始过程记录已移出当前代码仓，避免与持续维护文档混杂。详情见 `project-management/README.md`。
