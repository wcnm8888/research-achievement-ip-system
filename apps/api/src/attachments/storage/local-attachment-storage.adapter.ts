import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AttachmentObjectPutInput,
  AttachmentObjectPutResult,
  AttachmentObjectReadInput,
  AttachmentObjectReadResult,
  AttachmentObjectStatInput,
  AttachmentObjectStatResult,
  AttachmentStorageAdapter,
} from "./attachment-storage.adapter";

export const localAttachmentStorageRoot = path.resolve(
  resolveWorkspaceRoot(),
  "deploy",
  "artifacts",
  "local-attachments",
);
export const LOCAL_ATTACHMENT_STORAGE_ROOT = Symbol("LOCAL_ATTACHMENT_STORAGE_ROOT");

@Injectable()
export class LocalAttachmentStorageAdapter implements AttachmentStorageAdapter {
  constructor(
    @Inject(LOCAL_ATTACHMENT_STORAGE_ROOT)
    private readonly storageRoot = localAttachmentStorageRoot,
  ) {}

  async putObject(input: AttachmentObjectPutInput): Promise<AttachmentObjectPutResult> {
    const targetPath = this.resolveObjectPath(input.objectKey);
    const body = toBodyBytes(input.body);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, body);

    return {
      objectKey: input.objectKey,
      checksum: input.checksum ?? createHash("sha256").update(body).digest("hex"),
      storedName: input.storedName ?? path.basename(targetPath),
      sizeBytes: body.byteLength,
    };
  }

  async getObject(input: AttachmentObjectReadInput): Promise<AttachmentObjectReadResult> {
    const targetPath = this.resolveObjectPath(input.objectKey);

    try {
      const body = await readFile(targetPath);
      return {
        objectKey: input.objectKey,
        body,
        sizeBytes: body.byteLength,
        storedName: path.basename(targetPath),
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return {
          objectKey: input.objectKey,
          body: null,
          sizeBytes: null,
          storedName: path.basename(targetPath),
        };
      }

      throw error;
    }
  }

  async statObject(input: AttachmentObjectStatInput): Promise<AttachmentObjectStatResult> {
    const targetPath = this.resolveObjectPath(input.objectKey);

    try {
      const result = await stat(targetPath);
      return {
        objectKey: input.objectKey,
        exists: result.isFile(),
        sizeBytes: result.size,
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return {
          objectKey: input.objectKey,
          exists: false,
          sizeBytes: null,
        };
      }

      throw error;
    }
  }

  resolveObjectPath(objectKey: string): string {
    const normalizedKey = objectKey.replace(/\\/g, "/");
    const segments = normalizedKey.split("/").filter(Boolean);

    if (
      segments.length === 0 ||
      segments.some((segment) => segment === "." || segment === ".." || path.isAbsolute(segment))
    ) {
      throw new Error("Invalid attachment storage key.");
    }

    const root = path.resolve(this.storageRoot);
    const targetPath = path.resolve(root, ...segments);
    const relative = path.relative(root, targetPath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Attachment storage key escapes storage root.");
    }

    return targetPath;
  }
}

const toBodyBytes = (body: string | Uint8Array | null | undefined): Uint8Array => {
  if (body === null || body === undefined) {
    return Buffer.alloc(0);
  }

  return typeof body === "string" ? Buffer.from(body) : body;
};

const isMissingFileError = (error: unknown): error is { code: "ENOENT" } =>
  Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "ENOENT");

function resolveWorkspaceRoot(startDirectory = process.cwd()): string {
  let current = path.resolve(startDirectory);

  while (true) {
    if (
      existsSync(path.join(current, "pnpm-workspace.yaml")) ||
      existsSync(path.join(current, ".git"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDirectory);
    }

    current = parent;
  }
}
