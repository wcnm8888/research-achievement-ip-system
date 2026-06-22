import { Inject, Injectable } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import { GrantTypeCode } from "../constants/grant-type-code";
import { ResourceTypeCode } from "../constants/resource-type-code";
import { SecretLevelCode } from "../constants/secret-level-code";
import { PolicyDecision, allowDecision, denyDecision } from "./policy-decision";
import {
  ResourceAccessGrantRecord,
  ResourceGrantPolicyService,
} from "./resource-grant-policy.service";

export type SecretResourceDescriptor = {
  resourceType: ResourceTypeCode;
  resourceId: string;
  secretLevel: SecretLevelCode;
  ownerUserId?: string | null;
};

@Injectable()
export class SecretAccessPolicyService {
  constructor(
    @Inject(ResourceGrantPolicyService)
    private readonly resourceGrantPolicy: ResourceGrantPolicyService,
  ) {}

  canReadResource(
    context: UserContext | null | undefined,
    resource: SecretResourceDescriptor,
    baseAccessDecision: PolicyDecision,
    grants: readonly ResourceAccessGrantRecord[],
    now: Date = new Date(),
  ): PolicyDecision {
    if (baseAccessDecision.effect === "DENY") {
      return denyDecision("Base resource access is required before secret policy.");
    }

    if (!context) {
      return denyDecision("User context is required.");
    }

    if (!isRestrictedSecretLevel(resource.secretLevel)) {
      return allowDecision("Resource is not restricted by secret policy.");
    }

    return this.resourceGrantPolicy.hasEffectiveGrant(
      context,
      grants,
      {
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        grantType: GrantTypeCode.secretRead,
      },
      now,
    );
  }
}

export const isRestrictedSecretLevel = (secretLevel: SecretLevelCode): boolean =>
  secretLevel === SecretLevelCode.secret || secretLevel === SecretLevelCode.confidential;
