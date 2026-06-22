import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { PermissionGuard } from "./guards/permission.guard";
import { UserContextGuard } from "./guards/user-context.guard";
import { AttachmentAccessPolicyService } from "./policy/attachment-access-policy.service";
import { AuditReadPolicyService } from "./policy/audit-read-policy.service";
import { AuditRedactorService } from "./policy/audit-redactor.service";
import { DepartmentScopeService } from "./policy/department-scope.service";
import { PolicyQueryFactory } from "./policy/policy-query.factory";
import { RbacPolicyService } from "./policy/rbac-policy.service";
import { ResourceGrantPolicyService } from "./policy/resource-grant-policy.service";
import { SecretAccessPolicyService } from "./policy/secret-access-policy.service";

@Module({
  imports: [IdentityModule],
  providers: [
    RbacPolicyService,
    DepartmentScopeService,
    PolicyQueryFactory,
    ResourceGrantPolicyService,
    SecretAccessPolicyService,
    AttachmentAccessPolicyService,
    AuditReadPolicyService,
    AuditRedactorService,
    UserContextGuard,
    PermissionGuard,
  ],
  exports: [
    RbacPolicyService,
    DepartmentScopeService,
    PolicyQueryFactory,
    ResourceGrantPolicyService,
    SecretAccessPolicyService,
    AttachmentAccessPolicyService,
    AuditReadPolicyService,
    AuditRedactorService,
    UserContextGuard,
    PermissionGuard,
  ],
})
export class AuthorizationModule {}
