export type AttachmentObjectPutInput = {
  objectKey: string;
  body?: string | Uint8Array | null;
  checksum?: string | null;
  mimeType?: string | null;
  originalName?: string | null;
  storedName?: string | null;
};

export type AttachmentObjectPutResult = {
  objectKey: string;
  checksum?: string | null;
  storedName?: string | null;
  sizeBytes?: number | null;
};

export type AttachmentObjectReadInput = {
  objectKey: string;
};

export type AttachmentObjectReadResult = {
  objectKey: string;
  body: Uint8Array | null;
  checksum?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  storedName?: string | null;
};

export type AttachmentObjectStatInput = {
  objectKey: string;
};

export type AttachmentObjectStatResult = {
  objectKey: string;
  exists: boolean;
  sizeBytes?: number | null;
};

export interface AttachmentStorageAdapter {
  putObject(input: AttachmentObjectPutInput): Promise<AttachmentObjectPutResult>;
  getObject(input: AttachmentObjectReadInput): Promise<AttachmentObjectReadResult>;
  statObject(input: AttachmentObjectStatInput): Promise<AttachmentObjectStatResult>;
}
