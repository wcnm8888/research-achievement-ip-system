import { Injectable } from "@nestjs/common";
import {
  AttachmentObjectPutInput,
  AttachmentObjectPutResult,
  AttachmentObjectReadInput,
  AttachmentObjectReadResult,
  AttachmentStorageAdapter,
} from "./attachment-storage.adapter";

@Injectable()
export class FakeAttachmentStorageAdapter implements AttachmentStorageAdapter {
  private readonly objects = new Map<string, AttachmentObjectReadResult>();

  async putObject(input: AttachmentObjectPutInput): Promise<AttachmentObjectPutResult> {
    const result = {
      objectKey: input.objectKey,
      body: input.body ?? null,
      checksum: input.checksum ?? null,
    };

    this.objects.set(input.objectKey, result);

    return {
      objectKey: input.objectKey,
      checksum: result.checksum,
    };
  }

  async getObject(input: AttachmentObjectReadInput): Promise<AttachmentObjectReadResult> {
    return (
      this.objects.get(input.objectKey) ?? {
        objectKey: input.objectKey,
        body: null,
        checksum: null,
      }
    );
  }
}
