import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { AchievementImportDryRunController } from "./achievement-import-dry-run.controller";
import { AchievementImportDryRunRepository } from "./achievement-import-dry-run.repository";
import { AchievementImportDryRunService } from "./achievement-import-dry-run.service";
import { AchievementImportJobRepository } from "./achievement-import-job.repository";
import { DepartmentImportJobRepository } from "./department-import-job.repository";
import { DepartmentImportDryRunController } from "./department-import-dry-run.controller";
import { DepartmentImportDryRunRepository } from "./department-import-dry-run.repository";
import { DepartmentImportDryRunService } from "./department-import-dry-run.service";
import { UserAccountImportDryRunController } from "./user-account-import-dry-run.controller";
import { UserAccountImportDryRunRepository } from "./user-account-import-dry-run.repository";
import { UserAccountImportDryRunService } from "./user-account-import-dry-run.service";
import { UserAccountImportJobRepository } from "./user-account-import-job.repository";

@Module({
  imports: [DatabaseModule, IdentityModule, AuthorizationModule, AuditModule],
  controllers: [
    AchievementImportDryRunController,
    DepartmentImportDryRunController,
    UserAccountImportDryRunController,
  ],
  providers: [
    AchievementImportDryRunRepository,
    AchievementImportDryRunService,
    AchievementImportJobRepository,
    DepartmentImportJobRepository,
    DepartmentImportDryRunRepository,
    DepartmentImportDryRunService,
    UserAccountImportDryRunRepository,
    UserAccountImportDryRunService,
    UserAccountImportJobRepository,
  ],
  exports: [
    AchievementImportDryRunService,
    DepartmentImportDryRunService,
    UserAccountImportDryRunService,
  ],
})
export class ImportsModule {}
