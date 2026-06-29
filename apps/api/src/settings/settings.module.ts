import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { ApiIntegrationSettingsController } from "./api-integration-settings.controller";
import { ApiIntegrationSettingsRepository } from "./api-integration-settings.repository";
import { ApiIntegrationSettingsService } from "./api-integration-settings.service";

@Module({
  imports: [DatabaseModule, IdentityModule, AuthorizationModule, AuditModule],
  controllers: [ApiIntegrationSettingsController],
  providers: [ApiIntegrationSettingsRepository, ApiIntegrationSettingsService],
  exports: [ApiIntegrationSettingsService],
})
export class SettingsModule {}
