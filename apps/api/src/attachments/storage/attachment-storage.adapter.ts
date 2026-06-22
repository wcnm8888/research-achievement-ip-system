export type AttachmentObjectPutInput = {
  objectKey: string;
  body?: string | Uint8Array | null;
  checksum?: string | null;
};

export type AttachmentObjectPutResult = {
  objectKey: string;
  checksum?: string | null;
};

export type AttachmentObjectReadInput = {
  objectKey: string;
};

export type AttachmentObjectReadResult = {
  objectKey: string;
  body: string | Uint8Array | null;
  checksum?: string | null;
};

export interface AttachmentStorageAdapter {
  putObject(input: AttachmentObjectPutInput): Promise<AttachmentObjectPutResult>;
  getObject(input: AttachmentObjectReadInput): Promise<AttachmentObjectReadResult>;
}
