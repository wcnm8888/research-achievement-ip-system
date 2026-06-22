import { Module } from "@nestjs/common";
import { AchievementRepository } from "../achievements/achievement.repository";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { WorkflowController } from "./workflow.controller";
import { WorkflowRepository } from "./workflow.repository";
import { WorkflowService } from "./workflow.service";

@Module({
  imports: [AuditModule, AuthorizationModule, DatabaseModule, IdentityModule],
  controllers: [WorkflowController],
  providers: [AchievementRepository, WorkflowRepository, WorkflowService],
  exports: [WorkflowRepository, WorkflowService],
})
export class WorkflowModule {}
