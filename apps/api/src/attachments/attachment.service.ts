import { Inject, Injectable } from "@nestjs/common";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import {
  AttachmentAccessPolicyService,
  AttachmentDescriptor,
} from "../authorization/policy/attachment-access-policy.service";
import { PolicyDecision, allowDecision, denyDecision } from "../authorization/policy/policy-decision";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { ResourceAccessGrantRecord } from "../authorization/policy/resource-grant-policy.service";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import {
  SecretAccessPolicyService,
  SecretResourceDescriptor,
} from "../authorization/policy/secret-access-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  AttachmentRepository,
  AttachmentTransactionClient,
} from "./attachment.repository";
import {
  AttachmentAccessDeniedError,
  AttachmentNotFoundError,
  AttachmentPreviewUnsupportedMediaTypeError,
  AttachmentStorageError,
  AttachmentUnsupportedRelationError,
  AttachmentVersionConflictError,
} from "./domain/attachment-errors";
import { CreateAchievementAttachmentInput } from "./domain/attachment-event.types";
import { toAttachmentDescriptor } from "./domain/attachment-prisma.mapper";
import {
  AttachmentAchievementParentRecord,
  AttachmentFeeParentRecord,
  AttachmentRecord,
} from "./domain/attachment-repository.types";
import { AttachmentRelationTypeCode } from "./domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "./domain/attachment-status-code";
import { buildAttachmentObjectKey, toSafeFileName } from "./domain/storage-key";
import { AttachmentMetadataDto } from "./dto/attachment-query.dto";
import {
  AttachmentStorageAdapter,
  AttachmentObjectPutInput,
  AttachmentObjectPutResult,
  AttachmentObjectReadResult,
} from "./storage/attachment-storage.adapter";
import { ATTACHMENT_STORAGE_ADAPTER } from "./storage/attachment-storage.provider";

export type AttachmentParentAccessInput = {
  context: UserContext | null | undefined;
  parentResource: SecretResourceDescriptor;
  parentAccessDecision: PolicyDecision;
  grants: readonly ResourceAccessGrantRecord[];
  now?: Date;
};

export type ListAttachmentMetadataInput = AttachmentParentAccessInput & {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  status?: AttachmentStatusCode;
  take?: number;
};

export type GetAttachmentMetadataForAccessInput = AttachmentParentAccessInput & {
  attachmentId: string;
};

export type AchievementAttachmentListQuery = {
  status?: AttachmentStatusCode;
  take?: number;
};

export type AchievementAttachmentUploadInput = {
  fileName: string;
  secretLevel?: SecretLevelCode;
  checksum?: string | null;
  objectBody?: string | Uint8Array | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  originalName?: string | null;
  storedName?: string | null;
  traceId?: string | null;
};

export type FeeVoucherAttachmentUploadInput = AchievementAttachmentUploadInput;

export type AttachmentDownloadDto = {
  id: string;
  fileName: string;
  version: number;
  mimeType: string | null;
  sizeBytes: number | null;
  body: Uint8Array | null;
};

export type AttachmentPreviewDto = AttachmentDownloadDto;

const previewMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);

@Injectable()
export class AttachmentService {
  constructor(
    @Inject(AttachmentRepository)
    private readonly attachmentRepository: AttachmentRepository,
    @Inject(AttachmentAccessPolicyService)
    private readonly attachmentAccessPolicy: AttachmentAccessPolicyService,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(SecretAccessPolicyService)
    private readonly secretAccessPolicy: SecretAccessPolicyService,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(ATTACHMENT_STORAGE_ADAPTER)
    private readonly storageAdapter: AttachmentStorageAdapter,
  ) {}

  async createAchievementAttachmentForUser(
    context: UserContext,
    achievementId: string,
    input: AchievementAttachmentUploadInput,
  ): Promise<AttachmentMetadataDto> {
    const parent = await this.loadWritableAchievementParent(context, achievementId);

    return this.createAttachmentForParent(context, {
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: achievementId,
      input,
      auditParent: this.toAchievementAuditParent(parent),
    });
  }

  async createFeeVoucherAttachmentForUser(
    context: UserContext,
    feeRecordId: string,
    input: FeeVoucherAttachmentUploadInput,
  ): Promise<AttachmentMetadataDto> {
    const parent = await this.loadWritableFeeParent(context, feeRecordId);

    return this.createAttachmentForParent(context, {
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: feeRecordId,
      input,
      auditParent: this.toFeeAuditParent(parent),
    });
  }

  async listAchievementMetadata(
    context: UserContext,
    achievementId: string,
    query: AchievementAttachmentListQuery = {},
  ): Promise<AttachmentMetadataDto[]> {
    const parentAccess = await this.loadReadableParentAccess(context, achievementId);

    return this.listMetadataForRelation({
      ...parentAccess,
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: achievementId,
      status: query.status,
      take: query.take,
    });
  }

  async listFeeVoucherMetadata(
    context: UserContext,
    feeRecordId: string,
    query: AchievementAttachmentListQuery = {},
  ): Promise<AttachmentMetadataDto[]> {
    const parentAccess = await this.loadReadableFeeParentAccess(context, feeRecordId);

    return this.listMetadataForRelation({
      ...parentAccess,
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: feeRecordId,
      status: query.status,
      take: query.take,
    });
  }

  async getAchievementAttachmentMetadata(
    context: UserContext,
    achievementId: string,
    attachmentId: string,
  ): Promise<AttachmentMetadataDto> {
    const record = await this.loadAchievementAttachmentRecord(achievementId, attachmentId);
    const parentAccess = await this.loadReadableParentAccess(context, achievementId, record.id);

    const decision = this.canReadMetadata(parentAccess, toAttachmentDescriptor(record));
    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    return toAttachmentMetadataDto(record);
  }

  async getFeeVoucherAttachmentMetadata(
    context: UserContext,
    feeRecordId: string,
    attachmentId: string,
  ): Promise<AttachmentMetadataDto> {
    const record = await this.loadFeeVoucherAttachmentRecord(feeRecordId, attachmentId);
    const parentAccess = await this.loadReadableFeeParentAccess(context, feeRecordId, record.id);

    const decision = this.canReadMetadata(parentAccess, toAttachmentDescriptor(record));
    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    return toAttachmentMetadataDto(record);
  }

  async downloadAchievementAttachment(
    context: UserContext,
    achievementId: string,
    attachmentId: string,
  ): Promise<AttachmentDownloadDto> {
    const record = await this.loadAchievementAttachmentRecord(achievementId, attachmentId);
    const parent = await this.attachmentRepository.findAchievementParentById(achievementId);
    if (!parent) {
      throw new AttachmentNotFoundError(achievementId);
    }

    const parentAccessDecision = await this.getBaseParentAccessDecision(
      context,
      achievementId,
    );
    const grants =
      await this.attachmentRepository.findResourceGrantsForAchievementAndAttachment({
        achievementId,
        attachmentId: record.id,
      });
    const decision = this.attachmentAccessPolicy.canDownload(
      context,
      toAttachmentDescriptor(record),
      this.toParentResource(parent),
      parentAccessDecision,
      grants,
    );

    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    const stored = await this.getObject(record.objectKey);
    await this.auditService.recordEvent(
      this.toAttachmentDownloadAuditEvent(
        context,
        this.toAchievementAuditParent(parent),
        record,
      ),
    );

    return {
      id: record.id,
      fileName: record.fileName,
      version: record.version,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes ?? stored.sizeBytes ?? null,
      body: stored.body,
    };
  }

  async previewAchievementAttachment(
    context: UserContext,
    achievementId: string,
    attachmentId: string,
  ): Promise<AttachmentPreviewDto> {
    const record = await this.loadAchievementAttachmentRecord(achievementId, attachmentId);
    this.assertPreviewable(record);
    const parent = await this.attachmentRepository.findAchievementParentById(achievementId);
    if (!parent) {
      throw new AttachmentNotFoundError(achievementId);
    }

    const parentAccessDecision = await this.getBaseParentAccessDecision(
      context,
      achievementId,
    );
    const grants =
      await this.attachmentRepository.findResourceGrantsForAchievementAndAttachment({
        achievementId,
        attachmentId: record.id,
      });
    const decision = this.attachmentAccessPolicy.canDownload(
      context,
      toAttachmentDescriptor(record),
      this.toParentResource(parent),
      parentAccessDecision,
      grants,
    );

    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    const stored = await this.getObject(record.objectKey);
    await this.auditService.recordEvent(
      this.toAttachmentPreviewAuditEvent(
        context,
        this.toAchievementAuditParent(parent),
        record,
        "achievement",
      ),
    );

    return {
      id: record.id,
      fileName: record.fileName,
      version: record.version,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes ?? stored.sizeBytes ?? null,
      body: stored.body,
    };
  }

  async downloadFeeVoucherAttachment(
    context: UserContext,
    feeRecordId: string,
    attachmentId: string,
  ): Promise<AttachmentDownloadDto> {
    const record = await this.loadFeeVoucherAttachmentRecord(feeRecordId, attachmentId);
    const parentAccess = await this.loadReadableFeeParentAccess(context, feeRecordId, record.id);
    const decision = this.attachmentAccessPolicy.canDownload(
      context,
      toAttachmentDescriptor(record),
      parentAccess.parentResource,
      parentAccess.parentAccessDecision,
      parentAccess.grants,
    );

    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    const stored = await this.getObject(record.objectKey);
    await this.auditService.recordEvent(
      this.toAttachmentDownloadAuditEvent(context, parentAccess.auditParent, record),
    );

    return {
      id: record.id,
      fileName: record.fileName,
      version: record.version,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes ?? stored.sizeBytes ?? null,
      body: stored.body,
    };
  }

  async previewFeeVoucherAttachment(
    context: UserContext,
    feeRecordId: string,
    attachmentId: string,
  ): Promise<AttachmentPreviewDto> {
    const record = await this.loadFeeVoucherAttachmentRecord(feeRecordId, attachmentId);
    this.assertPreviewable(record);
    const parentAccess = await this.loadReadableFeeParentAccess(context, feeRecordId, record.id);
    const decision = this.attachmentAccessPolicy.canDownload(
      context,
      toAttachmentDescriptor(record),
      parentAccess.parentResource,
      parentAccess.parentAccessDecision,
      parentAccess.grants,
    );

    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    const stored = await this.getObject(record.objectKey);
    await this.auditService.recordEvent(
      this.toAttachmentPreviewAuditEvent(context, parentAccess.auditParent, record, "feeVoucher"),
    );

    return {
      id: record.id,
      fileName: record.fileName,
      version: record.version,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes ?? stored.sizeBytes ?? null,
      body: stored.body,
    };
  }

  async createMetadata(
    input: CreateAchievementAttachmentInput,
  ): Promise<AttachmentMetadataDto> {
    const relationType = AttachmentRelationTypeCode.achievement;
    const version = await this.calculateNextVersion({
      relationType,
      relationId: input.relationId,
      fileName: input.fileName,
    });
    const objectKey = buildAttachmentObjectKey({
      relationType,
      relationId: input.relationId,
      fileName: input.fileName,
      version,
    });
    const stored = await this.putObject({
      objectKey,
      body: input.objectBody,
      checksum: input.checksum,
      mimeType: input.mimeType,
      originalName: input.originalName,
      storedName: input.storedName,
    });

    try {
      const record = await this.attachmentRepository.create({
        relationType,
        relationId: input.relationId,
        fileName: input.fileName,
        objectKey: stored.objectKey,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? stored.sizeBytes ?? null,
        storageProvider: "LOCAL_DISK",
        originalName: input.originalName ?? input.fileName,
        storedName: stored.storedName ?? input.storedName ?? toSafeFileName(input.fileName),
        version,
        uploaderId: input.uploaderId,
        secretLevel: input.secretLevel ?? SecretLevelCode.internal,
        checksum: stored.checksum ?? input.checksum ?? null,
      });

      return toAttachmentMetadataDto(record);
    } catch (error) {
      throw this.mapCreateError(error, relationType, input.relationId, input.fileName, version);
    }
  }

  async createMetadataInTransaction(
    client: AttachmentTransactionClient,
    input: CreateAchievementAttachmentInput,
  ): Promise<AttachmentMetadataDto> {
    const relationType = AttachmentRelationTypeCode.achievement;
    const version = await this.calculateNextVersionInTransaction(client, {
      relationType,
      relationId: input.relationId,
      fileName: input.fileName,
    });
    const objectKey = buildAttachmentObjectKey({
      relationType,
      relationId: input.relationId,
      fileName: input.fileName,
      version,
    });
    const stored = await this.putObject({
      objectKey,
      body: input.objectBody,
      checksum: input.checksum,
      mimeType: input.mimeType,
      originalName: input.originalName,
      storedName: input.storedName,
    });

    try {
      const record = await this.attachmentRepository.createInTransaction(client, {
        relationType,
        relationId: input.relationId,
        fileName: input.fileName,
        objectKey: stored.objectKey,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? stored.sizeBytes ?? null,
        storageProvider: "LOCAL_DISK",
        originalName: input.originalName ?? input.fileName,
        storedName: stored.storedName ?? input.storedName ?? toSafeFileName(input.fileName),
        version,
        uploaderId: input.uploaderId,
        secretLevel: input.secretLevel ?? SecretLevelCode.internal,
        checksum: stored.checksum ?? input.checksum ?? null,
      });

      return toAttachmentMetadataDto(record);
    } catch (error) {
      throw this.mapCreateError(error, relationType, input.relationId, input.fileName, version);
    }
  }

  async listMetadataForRelation(
    input: ListAttachmentMetadataInput,
  ): Promise<AttachmentMetadataDto[]> {
    this.assertSupportedRelation(input.relationType);

    const records = await this.attachmentRepository.findManyByRelation({
      relationType: input.relationType,
      relationId: input.relationId,
      status: input.status ?? AttachmentStatusCode.active,
      take: input.take,
    });

    return records
      .filter(
        (record) =>
          this.canReadMetadata(input, toAttachmentDescriptor(record)).effect === "ALLOW",
      )
      .map(toAttachmentMetadataDto);
  }

  async getMetadataForAccessCheck(
    input: GetAttachmentMetadataForAccessInput,
  ): Promise<AttachmentMetadataDto> {
    const record = await this.attachmentRepository.findById(input.attachmentId);
    if (!record) {
      throw new AttachmentNotFoundError(input.attachmentId);
    }

    this.assertSupportedRelation(record.relationType);

    const decision = this.canReadMetadata(input, toAttachmentDescriptor(record));
    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    return toAttachmentMetadataDto(record);
  }

  private calculateNextVersion(input: {
    relationType: AttachmentRelationTypeCode;
    relationId: string;
    fileName: string;
  }): Promise<number> {
    return this.attachmentRepository
      .findLatestVersion(input)
      .then((latestVersion) => (latestVersion ?? 0) + 1);
  }

  private calculateNextVersionInTransaction(
    client: AttachmentTransactionClient,
    input: {
      relationType: AttachmentRelationTypeCode;
      relationId: string;
      fileName: string;
    },
  ): Promise<number> {
    return this.attachmentRepository
      .findLatestVersionInTransaction(client, input)
      .then((latestVersion) => (latestVersion ?? 0) + 1);
  }

  private canReadMetadata(
    input: AttachmentParentAccessInput,
    attachment: AttachmentDescriptor,
  ): PolicyDecision {
    return this.attachmentAccessPolicy.canReadMetadata(
      input.context,
      attachment,
      input.parentResource,
      input.parentAccessDecision,
      input.grants,
      input.now,
    );
  }

  private async createAttachmentForParent(
    context: UserContext,
    input: {
      relationType: AttachmentRelationTypeCode;
      relationId: string;
      input: AchievementAttachmentUploadInput;
      auditParent: AttachmentAuditParent;
    },
  ): Promise<AttachmentMetadataDto> {
    this.assertSupportedRelation(input.relationType);

    const version = await this.calculateNextVersion({
      relationType: input.relationType,
      relationId: input.relationId,
      fileName: input.input.fileName,
    });
    const objectKey = buildAttachmentObjectKey({
      relationType: input.relationType,
      relationId: input.relationId,
      fileName: input.input.fileName,
      version,
    });
    const stored = await this.putObject({
      objectKey,
      body: input.input.objectBody,
      checksum: input.input.checksum,
      mimeType: input.input.mimeType,
      originalName: input.input.originalName,
      storedName: input.input.storedName,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const record = await this.attachmentRepository.createInTransaction(
          tx as AttachmentTransactionClient,
          {
            relationType: input.relationType,
            relationId: input.relationId,
            fileName: input.input.fileName,
            objectKey: stored.objectKey,
            mimeType: input.input.mimeType ?? null,
            sizeBytes: input.input.sizeBytes ?? stored.sizeBytes ?? null,
            storageProvider: "LOCAL_DISK",
            originalName: input.input.originalName ?? input.input.fileName,
            storedName:
              stored.storedName ??
              input.input.storedName ??
              toSafeFileName(input.input.fileName),
            version,
            uploaderId: context.userId,
            secretLevel: input.input.secretLevel ?? SecretLevelCode.internal,
            checksum: stored.checksum ?? input.input.checksum ?? null,
          },
        );

        await this.auditService.recordEventInTransaction(
          tx as AuditTransactionClient,
          this.toAttachmentUploadAuditEvent(
            context,
            input.auditParent,
            record,
            input.input.traceId,
          ),
        );

        return toAttachmentMetadataDto(record);
      });
    } catch (error) {
      throw this.mapCreateError(
        error,
        input.relationType,
        input.relationId,
        input.input.fileName,
        version,
      );
    }
  }

  private async loadWritableAchievementParent(
    context: UserContext,
    achievementId: string,
  ): Promise<AttachmentAchievementParentRecord> {
    const where = this.policyQueryFactory.achievementOwnedWhere(
      context,
      PermissionCode.achievementUpdateOwn,
    );
    const parent = await this.attachmentRepository.findAchievementParentByIdWhere(
      achievementId,
      where,
    );

    if (!parent) {
      throw new AttachmentNotFoundError(achievementId);
    }

    const grants =
      await this.attachmentRepository.findResourceGrantsForAchievementAndAttachment({
        achievementId,
      });
    const decision = this.secretAccessPolicy.canReadResource(
      context,
      this.toParentResource(parent),
      allowDecision("Base achievement update access is granted."),
      grants,
    );

    if (decision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(decision.reason);
    }

    return parent;
  }

  private async loadWritableFeeParent(
    context: UserContext,
    feeRecordId: string,
  ): Promise<AttachmentFeeParentRecord> {
    const where = this.policyQueryFactory.feeDepartmentWhere(
      context,
      PermissionCode.feeManageDepartment,
    );
    const parent = await this.attachmentRepository.findFeeParentByIdWhere(
      feeRecordId,
      where,
    );

    if (!parent) {
      throw new AttachmentNotFoundError(feeRecordId);
    }

    return parent;
  }

  private async loadReadableParentAccess(
    context: UserContext,
    achievementId: string,
    attachmentId?: string,
  ): Promise<AttachmentParentAccessInput> {
    const where = this.policyQueryFactory.achievementReadableWhere(context);
    const parent = await this.attachmentRepository.findAchievementParentByIdWhere(
      achievementId,
      where,
    );

    if (!parent) {
      throw new AttachmentNotFoundError(achievementId);
    }

    const grants =
      await this.attachmentRepository.findResourceGrantsForAchievementAndAttachment({
        achievementId,
        attachmentId,
      });
    const parentResource = this.toParentResource(parent);
    const parentAccessDecision = this.secretAccessPolicy.canReadResource(
      context,
      parentResource,
      allowDecision("Base achievement visibility is granted."),
      grants,
    );

    if (parentAccessDecision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(parentAccessDecision.reason);
    }

    return {
      context,
      parentResource,
      parentAccessDecision,
      grants,
    };
  }

  private async loadReadableFeeParentAccess(
    context: UserContext,
    feeRecordId: string,
    attachmentId?: string,
  ): Promise<AttachmentParentAccessInput & { auditParent: AttachmentAuditParent }> {
    const permissionDecision = this.rbacPolicy.hasAnyPermission(context, [
      PermissionCode.feeReadDepartment,
      PermissionCode.feeManageDepartment,
      PermissionCode.feeReviewDepartment,
    ]);

    if (permissionDecision.effect !== "ALLOW") {
      throw new AttachmentAccessDeniedError(permissionDecision.reason);
    }

    const parent = await this.attachmentRepository.findFeeParentByIdWhere(
      feeRecordId,
      this.feeVoucherReadableWhere(context),
    );

    if (!parent) {
      throw new AttachmentNotFoundError(feeRecordId);
    }

    const grants = await this.attachmentRepository.findResourceGrantsForFeeAndAttachment({
      feeRecordId,
      attachmentId,
    });
    const auditParent = this.toFeeAuditParent(parent);

    return {
      context,
      parentResource: this.toFeeParentResource(parent),
      parentAccessDecision: allowDecision("Base fee voucher visibility is granted."),
      grants,
      auditParent,
    };
  }

  private async getBaseParentAccessDecision(
    context: UserContext,
    achievementId: string,
  ): Promise<PolicyDecision> {
    const where = this.policyQueryFactory.achievementReadableWhere(context);
    const parent = await this.attachmentRepository.findAchievementParentByIdWhere(
      achievementId,
      where,
    );

    return parent
      ? allowDecision("Base achievement visibility is granted.")
      : denyDecision("Base achievement visibility is denied.");
  }

  private async loadAchievementAttachmentRecord(
    achievementId: string,
    attachmentId: string,
  ): Promise<AttachmentRecord> {
    const record = await this.attachmentRepository.findById(attachmentId);
    if (!record) {
      throw new AttachmentNotFoundError(attachmentId);
    }

    this.assertSupportedRelation(record.relationType);

    if (record.relationId !== achievementId) {
      throw new AttachmentNotFoundError(attachmentId);
    }

    return record;
  }

  private async loadFeeVoucherAttachmentRecord(
    feeRecordId: string,
    attachmentId: string,
  ): Promise<AttachmentRecord> {
    const record = await this.attachmentRepository.findById(attachmentId);
    if (!record) {
      throw new AttachmentNotFoundError(attachmentId);
    }

    if (
      record.relationType !== AttachmentRelationTypeCode.feeRecord ||
      record.relationId !== feeRecordId
    ) {
      throw new AttachmentNotFoundError(attachmentId);
    }

    return record;
  }

  private toParentResource(
    parent: AttachmentAchievementParentRecord,
  ): SecretResourceDescriptor {
    return {
      resourceType: ResourceTypeCode.achievement,
      resourceId: parent.id,
      secretLevel: parent.secretLevel,
      ownerUserId: parent.ownerUserId,
    };
  }

  private toFeeParentResource(parent: AttachmentFeeParentRecord): SecretResourceDescriptor {
    return {
      resourceType: ResourceTypeCode.feeRecord,
      resourceId: parent.id,
      secretLevel: SecretLevelCode.internal,
    };
  }

  private feeVoucherReadableWhere(context: UserContext): Parameters<
    AttachmentRepository["findFeeParentByIdWhere"]
  >[1] {
    return {
      OR: [
        this.policyQueryFactory.feeDepartmentWhere(
          context,
          PermissionCode.feeReadDepartment,
        ),
        this.policyQueryFactory.feeDepartmentWhere(
          context,
          PermissionCode.feeManageDepartment,
        ),
        this.policyQueryFactory.feeDepartmentWhere(
          context,
          PermissionCode.feeReviewDepartment,
        ),
      ],
    };
  }

  private toAchievementAuditParent(
    parent: AttachmentAchievementParentRecord,
  ): AttachmentAuditParent {
    return {
      relationKey: "achievementId",
      resourceId: parent.id,
      departmentId: parent.departmentId,
      secretLevel: parent.secretLevel,
    };
  }

  private toFeeAuditParent(parent: AttachmentFeeParentRecord): AttachmentAuditParent {
    return {
      relationKey: "feeRecordId",
      resourceId: parent.id,
      departmentId: parent.departmentId,
      secretLevel: SecretLevelCode.internal,
    };
  }

  private toAttachmentUploadAuditEvent(
    context: UserContext,
    parent: AttachmentAuditParent,
    record: AttachmentRecord,
    traceId?: string | null,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.uploadAttachment,
      target: {
        type: AuditTargetTypeCode.attachment,
        id: record.id,
        departmentId: parent.departmentId,
        secretLevel: record.secretLevel,
      },
      oldValue: null,
      newValue: this.toAttachmentAuditSummary(
        record,
        AuditActionCode.uploadAttachment,
        parent,
        {
          createdAt: record.createdAt.toISOString(),
          uploaderId: record.uploaderId,
        },
      ),
      traceId: traceId ?? null,
    };
  }

  private toAttachmentDownloadAuditEvent(
    context: UserContext,
    parent: AttachmentAuditParent,
    record: AttachmentRecord,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.downloadAttachment,
      target: {
        type: AuditTargetTypeCode.attachment,
        id: record.id,
        departmentId: parent.departmentId,
        secretLevel: record.secretLevel,
      },
      oldValue: null,
      newValue: this.toAttachmentAuditSummary(
        record,
        AuditActionCode.downloadAttachment,
        parent,
        {
          downloadedAt: new Date().toISOString(),
        },
      ),
    };
  }

  private toAttachmentPreviewAuditEvent(
    context: UserContext,
    parent: AttachmentAuditParent,
    record: AttachmentRecord,
    relationType: "achievement" | "feeVoucher",
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.downloadAttachment,
      target: {
        type: AuditTargetTypeCode.attachment,
        id: record.id,
        departmentId: parent.departmentId,
        secretLevel: record.secretLevel,
      },
      oldValue: null,
      newValue: {
        operation: "PREVIEW_ATTACHMENT",
        relationType,
        attachmentId: record.id,
        fileName: record.fileName,
        mimeType: record.mimeType ?? "",
        sizeBytes: record.sizeBytes ?? 0,
      },
    };
  }

  private toAttachmentAuditSummary(
    record: AttachmentRecord,
    action: AuditActionCode,
    parent: AttachmentAuditParent,
    extra: Record<string, string>,
  ): Record<string, string | number> {
    return {
      action,
      attachmentId: record.id,
      [parent.relationKey]: parent.resourceId,
      relationId: record.relationId,
      relationType: record.relationType,
      fileName: record.fileName,
      mimeType: record.mimeType ?? "",
      sizeBytes: record.sizeBytes ?? 0,
      version: record.version,
      secretLevel: record.secretLevel,
      status: record.status,
      ...extra,
    };
  }

  private async putObject(input: AttachmentObjectPutInput): Promise<AttachmentObjectPutResult> {
    try {
      return await this.storageAdapter.putObject(input);
    } catch (error) {
      throw new AttachmentStorageError(
        error instanceof Error ? error.message : "unknown storage error",
      );
    }
  }

  private async getObject(objectKey: string): Promise<AttachmentObjectReadResult> {
    try {
      const result = await this.storageAdapter.getObject({ objectKey });
      if (!result.body) {
        throw new AttachmentStorageError("attachment object was not found");
      }

      return result;
    } catch (error) {
      if (error instanceof AttachmentStorageError) {
        throw error;
      }

      throw new AttachmentStorageError(
        error instanceof Error ? error.message : "unknown storage error",
      );
    }
  }

  private assertPreviewable(record: AttachmentRecord): void {
    if (!record.mimeType || !previewMimeTypes.has(record.mimeType)) {
      throw new AttachmentPreviewUnsupportedMediaTypeError(record.mimeType);
    }
  }

  private assertSupportedRelation(relationType: AttachmentRelationTypeCode): void {
    if (
      relationType !== AttachmentRelationTypeCode.achievement &&
      relationType !== AttachmentRelationTypeCode.feeRecord
    ) {
      throw new AttachmentUnsupportedRelationError(relationType);
    }
  }

  private mapCreateError(
    error: unknown,
    relationType: AttachmentRelationTypeCode,
    relationId: string,
    fileName: string,
    version: number,
  ): Error {
    if (this.attachmentRepository.isPrismaUniqueConflict(error)) {
      return new AttachmentVersionConflictError(
        relationType,
        relationId,
        fileName,
        version,
      );
    }

    return error instanceof Error ? error : new Error("Unknown attachment create error.");
  }
}

const toAttachmentMetadataDto = (record: AttachmentRecord): AttachmentMetadataDto => ({
  id: record.id,
  relationType: record.relationType,
  relationId: record.relationId,
  fileName: record.fileName,
  mimeType: record.mimeType,
  sizeBytes: record.sizeBytes,
  storageProvider: record.storageProvider,
  originalName: record.originalName,
  storedName: record.storedName,
  version: record.version,
  uploaderId: record.uploaderId,
  secretLevel: record.secretLevel,
  status: record.status,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  archivedAt: record.archivedAt,
});

type AttachmentAuditParent = {
  relationKey: "achievementId" | "feeRecordId";
  resourceId: string;
  departmentId: string;
  secretLevel: SecretLevelCode;
};
