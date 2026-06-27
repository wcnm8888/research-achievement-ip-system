import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { AccountLifecycleMailer } from "./account-lifecycle-mailer";
import { AccountLifecycleRepository } from "./account-lifecycle.repository";
import { AccountLifecycleService } from "./account-lifecycle.service";

@Module({
  imports: [AuditModule, AuthorizationModule, DatabaseModule],
  providers: [
    AccountLifecycleMailer,
    AccountLifecycleRepository,
    AccountLifecycleService,
  ],
  exports: [AccountLifecycleService],
})
export class AccountLifecycleModule {}
