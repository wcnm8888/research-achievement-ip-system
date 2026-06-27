import { Module } from "@nestjs/common";
import { AccountLifecycleModule } from "../account-lifecycle/account-lifecycle.module";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [AccountLifecycleModule, AuditModule, AuthorizationModule, DatabaseModule, IdentityModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
