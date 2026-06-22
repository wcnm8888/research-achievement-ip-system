import { SecretLevelCode } from "../../authorization/constants/secret-level-code";

export type CreateAchievementAttachmentDto = {
  relationId: string;
  fileName: string;
  uploaderId: string;
  secretLevel?: SecretLevelCode;
  checksum?: string | null;
  objectBody?: string | Uint8Array | null;
  traceId?: string | null;
};
