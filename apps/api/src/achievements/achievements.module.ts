import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { WorkflowModule } from "../workflow/workflow.module";
import { AchievementController } from "./achievement.controller";
import { AchievementRepository } from "./achievement.repository";
import { AchievementService } from "./achievement.service";

@Module({
  imports: [AuditModule, AuthorizationModule, DatabaseModule, IdentityModule, WorkflowModule],
  controllers: [AchievementController],
  providers: [AchievementRepository, AchievementService],
  exports: [AchievementRepository, AchievementService],
})
export class AchievementsModule {}
