import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { DepartmentManagementController } from "./department-management.controller";
import { DepartmentManagementRepository } from "./department-management.repository";
import { DepartmentManagementService } from "./department-management.service";

@Module({
  imports: [DatabaseModule, IdentityModule, AuthorizationModule, AuditModule],
  controllers: [DepartmentManagementController],
  providers: [DepartmentManagementRepository, DepartmentManagementService],
  exports: [DepartmentManagementService],
})
export class DepartmentManagementModule {}
