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
  AttachmentStorageError,
  AttachmentUnsupportedRelationError,
  AttachmentVersionConflictError,
} from "./domain/attachment-errors";
import { CreateAchievementAttachmentInput } from "./domain/attachment-event.types";
import { toAttachmentDescriptor } from "./domain/attachment-prisma.mapper";
import {
  AttachmentAchievementParentRecord,
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

export type AttachmentDownloadDto = {
  id: string;
  fileName: string;
  version: number;
  mimeType: string | null;
  sizeBytes: number | null;
  body: Uint8Array | null;
};

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
    const relationType = AttachmentRelationTypeCode.achievement;
    const version = await this.calculateNextVersion({
      relationType,
      relationId: achievementId,
      fileName: input.fileName,
    });
    const objectKey = buildAttachmentObjectKey({
      relationType,
      relationId: achievementId,
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
      return await this.prisma.$transaction(async (tx) => {
        const record = await this.attachmentRepository.createInTransaction(
          tx as AttachmentTransactionClient,
          {
            relationType,
            relationId: achievementId,
            fileName: input.fileName,
            objectKey: stored.objectKey,
            mimeType: input.mimeType ?? null,
            sizeBytes: input.sizeBytes ?? stored.sizeBytes ?? null,
            storageProvider: "LOCAL_DISK",
            originalName: input.originalName ?? input.fileName,
            storedName: stored.storedName ?? input.storedName ?? toSafeFileName(input.fileName),
            version,
            uploaderId: context.userId,
            secretLevel: input.secretLevel ?? SecretLevelCode.internal,
            checksum: stored.checksum ?? input.checksum ?? null,
          },
        );

        await this.auditService.recordEventInTransaction(
          tx as AuditTransactionClient,
          this.toAttachmentUploadAuditEvent(context, parent, record, input.traceId),
        );

        return toAttachmentMetadataDto(record);
      });
    } catch (error) {
      throw this.mapCreateError(error, relationType, achievementId, input.fileName, version);
    }
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
      this.toAttachmentDownloadAuditEvent(context, parent, record),
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

  private toAttachmentUploadAuditEvent(
    context: UserContext,
    parent: AttachmentAchievementParentRecord,
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
    parent: AttachmentAchievementParentRecord,
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
        {
          downloadedAt: new Date().toISOString(),
        },
      ),
    };
  }

  private toAttachmentAuditSummary(
    record: AttachmentRecord,
    action: AuditActionCode,
    extra: Record<string, string>,
  ): Record<string, string | number> {
    return {
      action,
      attachmentId: record.id,
      achievementId: record.relationId,
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

  private assertSupportedRelation(relationType: AttachmentRelationTypeCode): void {
    if (relationType !== AttachmentRelationTypeCode.achievement) {
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
