import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { AttachmentRelationTypeCode } from "./attachment-relation-type-code";

export type CreateAttachmentMetadataInput = {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  fileName: string;
  objectKey: string;
  version: number;
  uploaderId: string;
  secretLevel: SecretLevelCode;
  checksum?: string | null;
  createdAt?: Date;
};

export type CreateAchievementAttachmentInput = {
  relationId: string;
  fileName: string;
  uploaderId: string;
  secretLevel?: SecretLevelCode;
  checksum?: string | null;
  objectBody?: string | Uint8Array | null;
  traceId?: string | null;
};
