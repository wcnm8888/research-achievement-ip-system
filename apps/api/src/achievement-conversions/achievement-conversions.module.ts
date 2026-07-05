import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { AchievementConversionController } from "./achievement-conversion.controller";
import { AchievementConversionRepository } from "./achievement-conversion.repository";
import { AchievementConversionService } from "./achievement-conversion.service";

@Module({
  imports: [AuditModule, AuthorizationModule, DatabaseModule, IdentityModule],
  controllers: [AchievementConversionController],
  providers: [AchievementConversionRepository, AchievementConversionService],
  exports: [AchievementConversionRepository, AchievementConversionService],
})
export class AchievementConversionsModule {}
