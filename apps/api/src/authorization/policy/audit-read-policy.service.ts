import { Inject, Injectable } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import { PermissionCode } from "../constants/permission-code";
import { PolicyDecision, denyDecision } from "./policy-decision";
import { RbacPolicyService } from "./rbac-policy.service";

@Injectable()
export class AuditReadPolicyService {
  constructor(@Inject(RbacPolicyService) private readonly rbacPolicy: RbacPolicyService) {}

  canReadMaskedAudit(context: UserContext | null | undefined): PolicyDecision {
    return this.rbacPolicy.hasPermission(context, PermissionCode.auditReadMasked);
  }

  canReadUnmaskedAudit(): PolicyDecision {
    return denyDecision("Unmasked audit read is not allowed in Step 4C.");
  }
}
