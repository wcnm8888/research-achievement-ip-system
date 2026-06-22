import { describe, expect, it } from "vitest";
import { FakeAttachmentStorageAdapter } from "./fake-attachment-storage.adapter";

describe("FakeAttachmentStorageAdapter", () => {
  it("stores and reads objects in memory only", async () => {
    const adapter = new FakeAttachmentStorageAdapter();

    await expect(
      adapter.putObject({
        objectKey: "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
        body: "fake body",
        checksum: "fake-digest",
      }),
    ).resolves.toEqual({
      objectKey: "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
      checksum: "fake-digest",
    });

    await expect(
      adapter.getObject({
        objectKey: "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
      }),
    ).resolves.toEqual({
      objectKey: "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
      body: "fake body",
      checksum: "fake-digest",
    });
  });

  it("returns an empty fake result for a missing object", async () => {
    const adapter = new FakeAttachmentStorageAdapter();

    await expect(adapter.getObject({ objectKey: "missing" })).resolves.toEqual({
      objectKey: "missing",
      body: null,
      checksum: null,
    });
  });
});
