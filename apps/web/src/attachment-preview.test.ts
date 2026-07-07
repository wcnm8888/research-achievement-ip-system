import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAttachmentPreviewObjectUrl,
  downloadAttachmentPreviewBlob,
  getAttachmentPreviewKind,
  isPreviewableAttachment,
  revokeAttachmentPreviewObjectUrl,
} from "./attachment-preview";

describe("attachment preview helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows only PDF, PNG, and JPEG previews", () => {
    expect(isPreviewableAttachment("application/pdf")).toBe(true);
    expect(isPreviewableAttachment("image/png")).toBe(true);
    expect(isPreviewableAttachment("image/jpeg")).toBe(true);
    expect(isPreviewableAttachment("image/svg+xml")).toBe(false);
    expect(isPreviewableAttachment("text/html")).toBe(false);
    expect(isPreviewableAttachment("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(
      false,
    );
  });

  it("classifies preview renderers without exposing raw paths", () => {
    expect(getAttachmentPreviewKind("application/pdf")).toBe("pdf");
    expect(getAttachmentPreviewKind("image/png")).toBe("image");
    expect(getAttachmentPreviewKind("image/jpeg")).toBe("image");
    expect(getAttachmentPreviewKind("text/html")).toBe("unsupported");
  });

  it("downloads preview blobs through the API client", async () => {
    const blob = new Blob(["preview"], { type: "application/pdf" });
    const downloadBlob = vi.fn().mockResolvedValue(blob);

    await expect(
      downloadAttachmentPreviewBlob({ downloadBlob }, "/attachments/attachment-id/preview"),
    ).resolves.toBe(blob);
    expect(downloadBlob).toHaveBeenCalledWith("/attachments/attachment-id/preview");
  });

  it("creates and revokes object URLs for modal previews", () => {
    const createObjectURL = vi.fn(() => "blob:preview-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const blob = new Blob(["preview"], { type: "image/png" });

    expect(createAttachmentPreviewObjectUrl(blob)).toBe("blob:preview-url");
    revokeAttachmentPreviewObjectUrl("blob:preview-url");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-url");
  });
});
