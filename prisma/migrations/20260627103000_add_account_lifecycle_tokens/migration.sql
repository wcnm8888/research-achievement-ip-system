-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_ACTIVATION';

-- AlterEnum
ALTER TYPE "AuditActionType" ADD VALUE 'INVITE_CREATED';
ALTER TYPE "AuditActionType" ADD VALUE 'INVITE_RESENT';
ALTER TYPE "AuditActionType" ADD VALUE 'INVITE_ACCEPTED';
ALTER TYPE "AuditActionType" ADD VALUE 'INVITE_REVOKED';
ALTER TYPE "AuditActionType" ADD VALUE 'PASSWORD_RESET_REQUESTED_SELF';
ALTER TYPE "AuditActionType" ADD VALUE 'PASSWORD_RESET_REQUESTED_ADMIN';
ALTER TYPE "AuditActionType" ADD VALUE 'PASSWORD_RESET_CONFIRMED';
ALTER TYPE "AuditActionType" ADD VALUE 'PASSWORD_RESET_REVOKED';
ALTER TYPE "AuditActionType" ADD VALUE 'PASSWORD_RESET_FAILED';
ALTER TYPE "AuditActionType" ADD VALUE 'CREDENTIAL_CHANGED';

-- CreateEnum
CREATE TYPE "AccountLifecycleTokenPurpose" AS ENUM ('INVITE_ACCEPT', 'PASSWORD_RESET_SELF', 'PASSWORD_RESET_ADMIN');

-- CreateEnum
CREATE TYPE "AccountLifecycleTokenStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AccountLifecycleDeliveryChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "AccountLifecycleDeliveryStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'FAILED', 'SUPPRESSED');

-- AlterTable
ALTER TABLE "user_credentials"
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "account_lifecycle_tokens" (
    "id" UUID NOT NULL,
    "purpose" "AccountLifecycleTokenPurpose" NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "target_user_id" UUID,
    "email_hash" VARCHAR(128),
    "status" "AccountLifecycleTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" VARCHAR(500),
    "created_by_user_id" UUID,
    "created_by_ip_hash" VARCHAR(128),
    "created_user_agent_hash" VARCHAR(128),
    "delivery_channel" "AccountLifecycleDeliveryChannel",
    "delivery_status" "AccountLifecycleDeliveryStatus",
    "delivery_adapter" VARCHAR(64),
    "audit_correlation_id" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_lifecycle_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_lifecycle_tokens_token_hash_key" ON "account_lifecycle_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "account_lifecycle_tokens_target_user_id_purpose_status_idx" ON "account_lifecycle_tokens"("target_user_id", "purpose", "status");

-- CreateIndex
CREATE INDEX "account_lifecycle_tokens_email_hash_purpose_status_idx" ON "account_lifecycle_tokens"("email_hash", "purpose", "status");

-- CreateIndex
CREATE INDEX "account_lifecycle_tokens_status_expires_at_idx" ON "account_lifecycle_tokens"("status", "expires_at");

-- CreateIndex
CREATE INDEX "account_lifecycle_tokens_created_by_user_id_idx" ON "account_lifecycle_tokens"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "account_lifecycle_tokens" ADD CONSTRAINT "account_lifecycle_tokens_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_lifecycle_tokens" ADD CONSTRAINT "account_lifecycle_tokens_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
