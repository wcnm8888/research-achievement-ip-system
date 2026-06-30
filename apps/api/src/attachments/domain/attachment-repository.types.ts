import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { ResourceAccessGrantRecord } from "../../authorization/policy/resource-grant-policy.service";
import { AttachmentRelationTypeCode } from "./attachment-relation-type-code";
import { AttachmentStatusCode } from "./attachment-status-code";

export type AttachmentRecord = {
  id: string;
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  fileName: string;
  objectKey: string;
  mimeType: string | null;
  sizeBytes: number | null;
  storageProvider: string | null;
  originalName: string | null;
  storedName: string | null;
  version: number;
  uploaderId: string;
  secretLevel: SecretLevelCode;
  checksum: string | null;
  status: AttachmentStatusCode;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type AttachmentLatestVersionInput = {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  fileName: string;
};

export type AttachmentRelationQueryInput = {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  status?: AttachmentStatusCode;
  take?: number;
};

export type AttachmentAchievementParentRecord = {
  id: string;
  departmentId: string;
  ownerUserId: string;
  secretLevel: SecretLevelCode;
};

export type AttachmentFeeParentRecord = {
  id: string;
  departmentId: string;
};

export type AttachmentResourceGrantRecord = ResourceAccessGrantRecord;
