import { Inject, Injectable } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import { AttachmentStatusCode } from "../constants/attachment-status-code";
import { GrantTypeCode } from "../constants/grant-type-code";
import { PermissionCode } from "../constants/permission-code";
import { ResourceTypeCode } from "../constants/resource-type-code";
import { SecretLevelCode } from "../constants/secret-level-code";
import { PolicyDecision, allowDecision, denyDecision } from "./policy-decision";
import {
  ResourceAccessGrantRecord,
  ResourceGrantPolicyService,
} from "./resource-grant-policy.service";
import { RbacPolicyService } from "./rbac-policy.service";
import {
  SecretResourceDescriptor,
  isRestrictedSecretLevel,
} from "./secret-access-policy.service";

export type AttachmentDescriptor = {
  id: string;
  status: AttachmentStatusCode;
  secretLevel: SecretLevelCode;
  uploaderId?: string | null;
};

@Injectable()
export class AttachmentAccessPolicyService {
  constructor(
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(ResourceGrantPolicyService)
    private readonly resourceGrantPolicy: ResourceGrantPolicyService,
  ) {}

  canReadMetadata(
    context: UserContext | null | undefined,
    attachment: AttachmentDescriptor,
    parentResource: SecretResourceDescriptor,
    parentAccessDecision: PolicyDecision,
    grants: readonly ResourceAccessGrantRecord[],
    now: Date = new Date(),
  ): PolicyDecision {
    const basicDecision = this.canUseActiveAttachment(
      context,
      attachment,
      PermissionCode.attachmentReadMetadata,
    );

    if (basicDecision.effect === "DENY") {
      return basicDecision;
    }

    if (parentAccessDecision.effect === "DENY") {
      return denyDecision("Parent resource access is required to read attachment metadata.");
    }

    if (
      isRestrictedSecretLevel(attachment.secretLevel) &&
      !this.hasSecretReadForAttachment(context, attachment, parentResource, grants, now)
    ) {
      return denyDecision("Secret attachment metadata requires SECRET_READ.");
    }

    return allowDecision("Attachment metadata access is allowed.");
  }

  canDownload(
    context: UserContext | null | undefined,
    attachment: AttachmentDescriptor,
    parentResource: SecretResourceDescriptor,
    parentAccessDecision: PolicyDecision,
    grants: readonly ResourceAccessGrantRecord[],
    now: Date = new Date(),
  ): PolicyDecision {
    const basicDecision = this.canUseActiveAttachment(
      context,
      attachment,
      PermissionCode.attachmentDownload,
    );

    if (basicDecision.effect === "DENY") {
      return basicDecision;
    }

    if (this.hasDirectAttachmentDownloadGrant(context, attachment.id, grants, now)) {
      return allowDecision("Direct ATTACHMENT_DOWNLOAD grant allows this attachment download.");
    }

    if (parentAccessDecision.effect === "DENY") {
      return denyDecision("Parent resource access or direct attachment grant is required.");
    }

    if (
      isRestrictedSecretLevel(attachment.secretLevel) &&
      !this.hasSecretReadForAttachment(context, attachment, parentResource, grants, now)
    ) {
      return denyDecision("Secret attachment download requires SECRET_READ or direct grant.");
    }

    return allowDecision("Attachment download is allowed.");
  }

  private canUseActiveAttachment(
    context: UserContext | null | undefined,
    attachment: AttachmentDescriptor,
    permission: PermissionCode,
  ): PolicyDecision {
    const permissionDecision = this.rbacPolicy.hasPermission(context, permission);

    if (permissionDecision.effect === "DENY") {
      return permissionDecision;
    }

    if (attachment.status !== AttachmentStatusCode.active) {
      return denyDecision("Attachment is not active.");
    }

    return allowDecision("Attachment is active and static permission is granted.");
  }

  private hasSecretReadForAttachment(
    context: UserContext | null | undefined,
    attachment: AttachmentDescriptor,
    parentResource: SecretResourceDescriptor,
    grants: readonly ResourceAccessGrantRecord[],
    now: Date,
  ): boolean {
    if (!context) {
      return false;
    }

    return (
      this.resourceGrantPolicy.hasEffectiveGrant(
        context,
        grants,
        {
          resourceType: parentResource.resourceType,
          resourceId: parentResource.resourceId,
          grantType: GrantTypeCode.secretRead,
        },
        now,
      ).effect === "ALLOW" ||
      this.resourceGrantPolicy.hasEffectiveGrant(
        context,
        grants,
        {
          resourceType: ResourceTypeCode.attachment,
          resourceId: attachment.id,
          grantType: GrantTypeCode.secretRead,
        },
        now,
      ).effect === "ALLOW"
    );
  }

  private hasDirectAttachmentDownloadGrant(
    context: UserContext | null | undefined,
    attachmentId: string,
    grants: readonly ResourceAccessGrantRecord[],
    now: Date,
  ): boolean {
    if (!context) {
      return false;
    }

    return (
      this.resourceGrantPolicy.hasEffectiveGrant(
        context,
        grants,
        {
          resourceType: ResourceTypeCode.attachment,
          resourceId: attachmentId,
          grantType: GrantTypeCode.attachmentDownload,
        },
        now,
      ).effect === "ALLOW"
    );
  }
}
