import { Injectable } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import { GrantStatusCode } from "../constants/grant-status-code";
import { GrantTypeCode } from "../constants/grant-type-code";
import { GranteeTypeCode } from "../constants/grantee-type-code";
import { ResourceTypeCode } from "../constants/resource-type-code";
import { PolicyDecision, allowDecision, denyDecision } from "./policy-decision";

export type ResourceAccessGrantRecord = {
  resourceType: ResourceTypeCode;
  resourceId: string;
  granteeType: GranteeTypeCode;
  granteeId: string;
  grantType: GrantTypeCode;
  status: GrantStatusCode;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  revokedAt?: Date | string | null;
};

export type ResourceGrantRequest = {
  resourceType: ResourceTypeCode;
  resourceId: string;
  grantType: GrantTypeCode;
};

@Injectable()
export class ResourceGrantPolicyService {
  hasEffectiveGrant(
    context: UserContext | null | undefined,
    grants: readonly ResourceAccessGrantRecord[],
    request: ResourceGrantRequest,
    now: Date = new Date(),
  ): PolicyDecision {
    if (!context) {
      return denyDecision("User context is required.");
    }

    const grant = this.findEffectiveGrant(context, grants, request, now);

    if (!grant) {
      return denyDecision("No effective resource access grant matches the request.");
    }

    return allowDecision(`Effective ${grant.grantType} grant matched.`);
  }

  findEffectiveGrant(
    context: UserContext,
    grants: readonly ResourceAccessGrantRecord[],
    request: ResourceGrantRequest,
    now: Date = new Date(),
  ): ResourceAccessGrantRecord | null {
    return (
      grants.find(
        (grant) =>
          this.matchesRequest(grant, request) &&
          this.isGrantActive(grant, now) &&
          this.matchesGrantee(context, grant),
      ) ?? null
    );
  }

  private matchesRequest(
    grant: ResourceAccessGrantRecord,
    request: ResourceGrantRequest,
  ): boolean {
    return (
      grant.resourceType === request.resourceType &&
      grant.resourceId === request.resourceId &&
      grant.grantType === request.grantType
    );
  }

  private isGrantActive(grant: ResourceAccessGrantRecord, now: Date): boolean {
    if (grant.status !== GrantStatusCode.active || grant.revokedAt) {
      return false;
    }

    const startsAt = parseOptionalDate(grant.startsAt);
    const expiresAt = parseOptionalDate(grant.expiresAt);

    if (startsAt && startsAt.getTime() > now.getTime()) {
      return false;
    }

    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      return false;
    }

    return true;
  }

  private matchesGrantee(context: UserContext, grant: ResourceAccessGrantRecord): boolean {
    if (grant.granteeType === GranteeTypeCode.user) {
      return grant.granteeId === context.userId;
    }

    if (grant.granteeType === GranteeTypeCode.role) {
      return context.roleIds.includes(grant.granteeId);
    }

    if (grant.granteeType === GranteeTypeCode.department) {
      return grant.granteeId === context.departmentId;
    }

    return false;
  }
}

const parseOptionalDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};
