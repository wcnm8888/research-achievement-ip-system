-- AlterTable
ALTER TABLE "attachments"
ADD COLUMN "mime_type" VARCHAR(127),
ADD COLUMN "size_bytes" INTEGER,
ADD COLUMN "storage_provider" VARCHAR(32) DEFAULT 'LOCAL_DISK',
ADD COLUMN "original_name" VARCHAR(255),
ADD COLUMN "stored_name" VARCHAR(255);
