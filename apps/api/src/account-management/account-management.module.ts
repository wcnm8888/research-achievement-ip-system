import { Module } from "@nestjs/common";
import { AccountLifecycleModule } from "../account-lifecycle/account-lifecycle.module";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { AccountManagementController } from "./account-management.controller";
import { AccountManagementRepository } from "./account-management.repository";
import { AccountManagementService } from "./account-management.service";

@Module({
  imports: [AccountLifecycleModule, DatabaseModule, IdentityModule, AuthorizationModule, AuditModule],
  controllers: [AccountManagementController],
  providers: [AccountManagementRepository, AccountManagementService],
  exports: [AccountManagementService],
})
export class AccountManagementModule {}
