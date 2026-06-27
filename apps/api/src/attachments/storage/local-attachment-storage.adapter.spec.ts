import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalAttachmentStorageAdapter } from "./local-attachment-storage.adapter";

describe("LocalAttachmentStorageAdapter", () => {
  it("puts, reads, and stats local attachment objects", async () => {
    const adapter = new LocalAttachmentStorageAdapter(await makeStorageRoot());
    const objectKey =
      "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/local/v1/paper.pdf";

    await expect(
      adapter.putObject({
        objectKey,
        body: Buffer.from("%PDF local test"),
        checksum: "digest",
        storedName: "paper.pdf",
      }),
    ).resolves.toEqual({
      objectKey,
      checksum: "digest",
      storedName: "paper.pdf",
      sizeBytes: 15,
    });

    const read = await adapter.getObject({ objectKey });
    expect(Buffer.from(read.body ?? [])).toEqual(Buffer.from("%PDF local test"));
    expect(read).toMatchObject({
      objectKey,
      sizeBytes: 15,
      storedName: "paper.pdf",
    });

    await expect(adapter.statObject({ objectKey })).resolves.toEqual({
      objectKey,
      exists: true,
      sizeBytes: 15,
    });
  });

  it("keeps generated keys inside the configured root", async () => {
    const root = await makeStorageRoot();
    const adapter = new LocalAttachmentStorageAdapter(root);
    const resolved = adapter.resolveObjectPath("attachments/safe/key.pdf");

    expect(path.relative(root, resolved)).toBe(path.join("attachments", "safe", "key.pdf"));
  });

  it("blocks path traversal storage keys", async () => {
    const adapter = new LocalAttachmentStorageAdapter(await makeStorageRoot());

    expect(() => adapter.resolveObjectPath("../escape.pdf")).toThrow(
      "Invalid attachment storage key.",
    );
    expect(() => adapter.resolveObjectPath("attachments/../../escape.pdf")).toThrow(
      "Invalid attachment storage key.",
    );
  });
});

const makeStorageRoot = async (): Promise<string> => {
  const root = path.resolve(
    process.cwd(),
    "..",
    "..",
    "deploy",
    "artifacts",
    "test-attachment-storage",
    randomUUID(),
  );
  await mkdir(root, { recursive: true });
  return root;
};
