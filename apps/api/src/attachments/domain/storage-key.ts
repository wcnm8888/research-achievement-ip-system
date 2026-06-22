import { randomUUID } from "node:crypto";
import { AttachmentRelationTypeCode } from "./attachment-relation-type-code";

export type BuildAttachmentObjectKeyInput = {
  relationType: AttachmentRelationTypeCode;
  relationId: string;
  fileName: string;
  version: number;
  uniqueId?: string;
};

export const buildAttachmentObjectKey = (
  input: BuildAttachmentObjectKeyInput,
): string => {
  const uniqueId = input.uniqueId ?? randomUUID();

  return [
    "attachments",
    input.relationType,
    input.relationId,
    uniqueId,
    `v${input.version}`,
    toSafeFileName(input.fileName),
  ].join("/");
};

export const toSafeFileName = (fileName: string): string => {
  const baseName = fileName.split(/[\\/]/).filter(Boolean).at(-1) ?? "attachment";
  const normalized = baseName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return normalized || "attachment";
};
