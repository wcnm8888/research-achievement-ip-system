import { Module } from "@nestjs/common";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { DepartmentImportDryRunController } from "./department-import-dry-run.controller";
import { DepartmentImportDryRunRepository } from "./department-import-dry-run.repository";
import { DepartmentImportDryRunService } from "./department-import-dry-run.service";
import { UserAccountImportDryRunController } from "./user-account-import-dry-run.controller";
import { UserAccountImportDryRunRepository } from "./user-account-import-dry-run.repository";
import { UserAccountImportDryRunService } from "./user-account-import-dry-run.service";

@Module({
  imports: [DatabaseModule, IdentityModule, AuthorizationModule],
  controllers: [
    DepartmentImportDryRunController,
    UserAccountImportDryRunController,
  ],
  providers: [
    DepartmentImportDryRunRepository,
    DepartmentImportDryRunService,
    UserAccountImportDryRunRepository,
    UserAccountImportDryRunService,
  ],
  exports: [DepartmentImportDryRunService, UserAccountImportDryRunService],
})
export class ImportsModule {}
