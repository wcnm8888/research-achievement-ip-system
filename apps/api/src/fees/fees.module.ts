import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { FeeController } from "./fee.controller";
import { FeeRepository } from "./fee.repository";
import { FeeService } from "./fee.service";

@Module({
  imports: [AuditModule, AuthorizationModule, DatabaseModule, IdentityModule],
  controllers: [FeeController],
  providers: [FeeRepository, FeeService],
  exports: [FeeRepository, FeeService],
})
export class FeesModule {}
