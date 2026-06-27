import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { AttachmentRelationTypeCode } from "./attachment-relation-type-code";

export type CreateAttachmentMetadataInput = {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  fileName: string;
  objectKey: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  storageProvider?: string | null;
  originalName?: string | null;
  storedName?: string | null;
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
  mimeType?: string | null;
  sizeBytes?: number | null;
  originalName?: string | null;
  storedName?: string | null;
  traceId?: string | null;
};
