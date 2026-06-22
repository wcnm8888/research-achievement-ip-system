import { Module } from "@nestjs/common";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { AuditController } from "./audit.controller";
import { AuditRepository } from "./audit.repository";
import { AuditService } from "./audit.service";

@Module({
  imports: [DatabaseModule, AuthorizationModule, IdentityModule],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
