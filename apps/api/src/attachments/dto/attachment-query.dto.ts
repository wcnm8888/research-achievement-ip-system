import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { AttachmentRelationTypeCode } from "../domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "../domain/attachment-status-code";

export type AttachmentRelationQueryDto = {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  status?: AttachmentStatusCode;
  take?: number;
};

export type AttachmentMetadataDto = {
  id: string;
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  fileName: string;
  version: number;
  uploaderId: string;
  secretLevel: SecretLevelCode;
  status: AttachmentStatusCode;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};
