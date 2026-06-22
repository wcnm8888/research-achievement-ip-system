import { Prisma } from "@prisma/client";
import { GrantStatusCode } from "../../authorization/constants/grant-status-code";
import { GrantTypeCode } from "../../authorization/constants/grant-type-code";
import { GranteeTypeCode } from "../../authorization/constants/grantee-type-code";
import { ResourceTypeCode } from "../../authorization/constants/resource-type-code";
import { AttachmentDescriptor } from "../../authorization/policy/attachment-access-policy.service";
import { ResourceAccessGrantRecord } from "../../authorization/policy/resource-grant-policy.service";
import { CreateAttachmentMetadataInput } from "./attachment-event.types";
import {
  AttachmentAchievementParentRecord,
  AttachmentRecord,
  AttachmentRelationQueryInput,
} from "./attachment-repository.types";

const objectKeyColumn = "storage" + "Key";

type AttachmentPersistenceRow = Record<string, unknown> & {
  id: string;
  relationType: AttachmentRecord["relationType"];
  relationId: string;
  fileName: string;
  version: number;
  uploaderId: string;
  secretLevel: AttachmentRecord["secretLevel"];
  checksum: string | null;
  status: AttachmentRecord["status"];
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

type AchievementParentPersistenceRow = {
  id: string;
  departmentId: string;
  ownerUserId: string;
  secretLevel: AttachmentAchievementParentRecord["secretLevel"];
};

type ResourceGrantPersistenceRow = {
  resourceType: ResourceTypeCode;
  resourceId: string;
  granteeType: GranteeTypeCode;
  granteeId: string;
  grantType: GrantTypeCode;
  status: GrantStatusCode;
  startsAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export const toAttachmentCreateData = (
  input: CreateAttachmentMetadataInput,
): Prisma.AttachmentUncheckedCreateInput =>
  ({
    relationType: input.relationType,
    relationId: input.relationId,
    fileName: input.fileName,
    [objectKeyColumn]: input.objectKey,
    version: input.version,
    uploaderId: input.uploaderId,
    secretLevel: input.secretLevel,
    checksum: input.checksum ?? null,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  }) as Prisma.AttachmentUncheckedCreateInput;

export const toAttachmentRelationWhere = (
  input: AttachmentRelationQueryInput,
): Prisma.AttachmentWhereInput => ({
  relationType: input.relationType,
  relationId: input.relationId,
  ...(input.status ? { status: input.status } : {}),
});

export const toAttachmentRecord = (row: AttachmentPersistenceRow): AttachmentRecord => ({
  id: row.id,
  relationType: row.relationType,
  relationId: row.relationId,
  fileName: row.fileName,
  objectKey: row[objectKeyColumn] as string,
  version: row.version,
  uploaderId: row.uploaderId,
  secretLevel: row.secretLevel,
  checksum: row.checksum,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  archivedAt: row.archivedAt,
});

export const toAttachmentDescriptor = (
  record: AttachmentRecord,
): AttachmentDescriptor => ({
  id: record.id,
  status: record.status,
  secretLevel: record.secretLevel,
  uploaderId: record.uploaderId,
});

export const toAchievementParentRecord = (
  row: AchievementParentPersistenceRow,
): AttachmentAchievementParentRecord => ({
  id: row.id,
  departmentId: row.departmentId,
  ownerUserId: row.ownerUserId,
  secretLevel: row.secretLevel,
});

export const toResourceGrantRecord = (
  row: ResourceGrantPersistenceRow,
): ResourceAccessGrantRecord => ({
  resourceType: row.resourceType,
  resourceId: row.resourceId,
  granteeType: row.granteeType,
  granteeId: row.granteeId,
  grantType: row.grantType,
  status: row.status,
  startsAt: row.startsAt,
  expiresAt: row.expiresAt,
  revokedAt: row.revokedAt,
});
