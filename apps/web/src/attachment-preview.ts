import type { ApiClient } from "./api-client";

export type AttachmentPreviewKind = "pdf" | "image" | "unsupported";

export const previewableAttachmentMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

const previewableMimeTypeSet = new Set<string>(previewableAttachmentMimeTypes);

export const isPreviewableAttachment = (mimeType: string | null | undefined): boolean =>
  Boolean(mimeType && previewableMimeTypeSet.has(mimeType));

export const getAttachmentPreviewKind = (
  mimeType: string | null | undefined,
): AttachmentPreviewKind => {
  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    return "image";
  }

  return "unsupported";
};

export const downloadAttachmentPreviewBlob = (
  client: Pick<ApiClient, "downloadBlob">,
  path: string,
): Promise<Blob> => {
  if (!client.downloadBlob) {
    throw new Error("Attachment preview requires blob API client support.");
  }

  return client.downloadBlob(path);
};

export const createAttachmentPreviewObjectUrl = (blob: Blob): string => {
  if (
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error("Attachment preview requires object URL support.");
  }

  return URL.createObjectURL(blob);
};

export const revokeAttachmentPreviewObjectUrl = (
  url: string | null | undefined,
): void => {
  if (
    url &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(url);
  }
};
