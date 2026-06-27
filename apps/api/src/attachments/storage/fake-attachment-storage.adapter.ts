import { Injectable } from "@nestjs/common";
import {
  AttachmentObjectPutInput,
  AttachmentObjectPutResult,
  AttachmentObjectReadInput,
  AttachmentObjectReadResult,
  AttachmentObjectStatInput,
  AttachmentObjectStatResult,
  AttachmentStorageAdapter,
} from "./attachment-storage.adapter";

@Injectable()
export class FakeAttachmentStorageAdapter implements AttachmentStorageAdapter {
  private readonly objects = new Map<string, AttachmentObjectReadResult>();

  async putObject(input: AttachmentObjectPutInput): Promise<AttachmentObjectPutResult> {
    const body = toBodyBytes(input.body);
    const result = {
      objectKey: input.objectKey,
      body,
      checksum: input.checksum ?? null,
      sizeBytes: body?.byteLength ?? null,
      mimeType: input.mimeType ?? null,
      storedName: input.storedName ?? null,
    };

    this.objects.set(input.objectKey, result);

    return {
      objectKey: input.objectKey,
      checksum: result.checksum,
      storedName: result.storedName,
      sizeBytes: result.sizeBytes,
    };
  }

  async getObject(input: AttachmentObjectReadInput): Promise<AttachmentObjectReadResult> {
    return (
      this.objects.get(input.objectKey) ?? {
        objectKey: input.objectKey,
        body: null,
        checksum: null,
        sizeBytes: null,
        mimeType: null,
        storedName: null,
      }
    );
  }

  async statObject(input: AttachmentObjectStatInput): Promise<AttachmentObjectStatResult> {
    const object = this.objects.get(input.objectKey);

    return {
      objectKey: input.objectKey,
      exists: Boolean(object),
      sizeBytes: object?.sizeBytes ?? null,
    };
  }
}

const toBodyBytes = (body: string | Uint8Array | null | undefined): Uint8Array | null => {
  if (body === null || body === undefined) {
    return null;
  }

  return typeof body === "string" ? Buffer.from(body) : body;
};
