-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PermissionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRoleScopeType" AS ENUM ('GLOBAL', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('ACHIEVEMENT', 'ATTACHMENT', 'FEE_RECORD', 'WORKFLOW_INSTANCE', 'AUDIT_LOG');

-- CreateEnum
CREATE TYPE "GranteeType" AS ENUM ('USER', 'ROLE', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "GrantType" AS ENUM ('SECRET_READ', 'SECRET_WRITE', 'ATTACHMENT_DOWNLOAD', 'AUDIT_READ');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('PAPER', 'PATENT', 'SOFTWARE_COPYRIGHT');

-- CreateEnum
CREATE TYPE "AchievementStatus" AS ENUM ('DRAFT', 'PENDING_DEPARTMENT_REVIEW', 'DEPARTMENT_REJECTED', 'PENDING_ARCHIVE', 'ARCHIVED', 'VOIDED');

-- CreateEnum
CREATE TYPE "SecretLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'SECRET', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "ContributorType" AS ENUM ('AUTHOR', 'INVENTOR', 'COPYRIGHT_OWNER');

-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('FIRST_AUTHOR', 'CORRESPONDING_AUTHOR', 'PRIMARY_INVENTOR', 'PARTICIPANT', 'OWNER', 'OTHER');

-- CreateEnum
CREATE TYPE "PatentType" AS ENUM ('INVENTION', 'UTILITY_MODEL', 'DESIGN', 'NATIONAL_DEFENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "PatentLegalStatus" AS ENUM ('PENDING', 'GRANTED', 'REJECTED', 'EXPIRED', 'TERMINATED', 'TRANSFERRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SoftwareType" AS ENUM ('APPLICATION', 'SYSTEM', 'TOOL', 'EMBEDDED', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkflowTargetType" AS ENUM ('ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowTaskStatus" AS ENUM ('PENDING', 'CLAIMED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowActionType" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'ARCHIVE', 'VOID', 'CANCEL');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PATENT_APPLICATION', 'PATENT_ANNUAL', 'SOFTWARE_COPYRIGHT', 'AGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "FundSource" AS ENUM ('PROJECT', 'DEPARTMENT', 'INSTITUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReminderTargetType" AS ENUM ('FEE_RECORD');

-- CreateEnum
CREATE TYPE "ReminderLevel" AS ENUM ('DAYS_30', 'DAYS_15', 'DAYS_7', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'CONFIRMED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttachmentRelationType" AS ENUM ('ACHIEVEMENT', 'FEE_RECORD', 'WORKFLOW_ACTION');

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'SUBMIT', 'APPROVE', 'REJECT', 'ARCHIVE', 'VOID', 'UPLOAD_ATTACHMENT', 'DOWNLOAD_ATTACHMENT', 'MARK_FEE_PAID', 'CONFIRM_REMINDER', 'CONFIG_UPDATE');

-- CreateEnum
CREATE TYPE "ApiIntegrationProvider" AS ENUM ('DOI', 'EMAIL', 'HR', 'FINANCE', 'PATENT', 'STORAGE', 'SEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "ApiCallStatus" AS ENUM ('SUCCESS', 'FAILED', 'TIMEOUT', 'RETRIED', 'SKIPPED');

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "parent_id" UUID,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "department_id" UUID NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_updated_at" TIMESTAMP(3),
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "disabled_at" TIMESTAMP(3),

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "RoleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "resource" VARCHAR(80) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "PermissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "scope_type" "UserRoleScopeType" NOT NULL DEFAULT 'GLOBAL',
    "scope_key" VARCHAR(120) NOT NULL DEFAULT 'GLOBAL',
    "department_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_access_grants" (
    "id" UUID NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "resource_id" UUID NOT NULL,
    "grantee_type" "GranteeType" NOT NULL,
    "grantee_id" UUID NOT NULL,
    "grant_type" "GrantType" NOT NULL,
    "status" "GrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "resource_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "type" "AchievementType" NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "status" "AchievementStatus" NOT NULL DEFAULT 'DRAFT',
    "secret_level" "SecretLevel" NOT NULL DEFAULT 'INTERNAL',
    "department_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "submitted_by_id" UUID,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "archived_by_id" UUID,
    "voided_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "void_reason" TEXT,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_details" (
    "achievement_id" UUID NOT NULL,
    "doi" VARCHAR(255),
    "doi_normalized" VARCHAR(255),
    "journal" VARCHAR(255),
    "issn_cn" VARCHAR(64),
    "publish_year" INTEGER,
    "included_type" VARCHAR(80),
    "impact_factor" DECIMAL(8,3),
    "partition" VARCHAR(80),
    "abstract" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_details_pkey" PRIMARY KEY ("achievement_id")
);

-- CreateTable
CREATE TABLE "patent_details" (
    "achievement_id" UUID NOT NULL,
    "application_no" VARCHAR(120),
    "application_no_normalized" VARCHAR(120),
    "grant_no" VARCHAR(120),
    "grant_no_normalized" VARCHAR(120),
    "patent_type" "PatentType",
    "filing_date" DATE,
    "grant_date" DATE,
    "next_fee_date" DATE,
    "fee_amount" DECIMAL(12,2),
    "legal_status" "PatentLegalStatus" NOT NULL DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patent_details_pkey" PRIMARY KEY ("achievement_id")
);

-- CreateTable
CREATE TABLE "software_copyright_details" (
    "achievement_id" UUID NOT NULL,
    "registration_no" VARCHAR(120),
    "registration_no_normalized" VARCHAR(120),
    "software_version" VARCHAR(80),
    "software_type" "SoftwareType",
    "publish_date" DATE,
    "register_date" DATE,
    "run_env" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_copyright_details_pkey" PRIMARY KEY ("achievement_id")
);

-- CreateTable
CREATE TABLE "achievement_contributors" (
    "id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "user_id" UUID,
    "organization" VARCHAR(255),
    "contributor_type" "ContributorType" NOT NULL,
    "contributor_role" "ContributorRole",
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievement_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" UUID NOT NULL,
    "target_type" "WorkflowTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_step" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tasks" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "assignee_id" UUID NOT NULL,
    "step_code" VARCHAR(80) NOT NULL,
    "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "claimed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_actions" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "task_id" UUID,
    "actor_id" UUID NOT NULL,
    "action" "WorkflowActionType" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_records" (
    "id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "fee_type" "FeeType" NOT NULL,
    "fund_source" "FundSource",
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_date" DATE,
    "pay_status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "voucher_no" VARCHAR(120),
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "fee_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_tasks" (
    "id" UUID NOT NULL,
    "target_type" "ReminderTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "remind_date" DATE NOT NULL,
    "remind_level" "ReminderLevel" NOT NULL,
    "receiver_id" UUID NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "reminder_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "relation_type" "AttachmentRelationType" NOT NULL,
    "relation_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploader_id" UUID NOT NULL,
    "secret_level" "SecretLevel" NOT NULL DEFAULT 'INTERNAL',
    "checksum" VARCHAR(128),
    "status" "AttachmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_department_id" UUID,
    "action" "AuditActionType" NOT NULL,
    "target_type" VARCHAR(100) NOT NULL,
    "target_id" UUID,
    "target_department_id" UUID,
    "target_secret_level" "SecretLevel",
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "trace_id" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_integrations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "provider" "ApiIntegrationProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "timeout_ms" INTEGER NOT NULL DEFAULT 3000,
    "config_ref" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "api_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_call_logs" (
    "id" UUID NOT NULL,
    "integration_code" VARCHAR(100) NOT NULL,
    "request_id" VARCHAR(120) NOT NULL,
    "status" "ApiCallStatus" NOT NULL,
    "duration_ms" INTEGER,
    "error_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "keyword" TEXT,
    "filters" JSONB,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_parent_id_idx" ON "departments"("parent_id");

-- CreateIndex
CREATE INDEX "departments_status_idx" ON "departments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_user_id_key" ON "user_credentials"("user_id");

-- CreateIndex
CREATE INDEX "user_credentials_user_id_idx" ON "user_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_status_idx" ON "roles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_department_id_idx" ON "user_roles"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_scope_type_scope_key_key" ON "user_roles"("user_id", "role_id", "scope_type", "scope_key");

-- CreateIndex
CREATE INDEX "resource_access_grants_resource_type_resource_id_idx" ON "resource_access_grants"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "resource_access_grants_grantee_type_grantee_id_idx" ON "resource_access_grants"("grantee_type", "grantee_id");

-- CreateIndex
CREATE INDEX "resource_access_grants_status_idx" ON "resource_access_grants"("status");

-- CreateIndex
CREATE INDEX "resource_access_grants_expires_at_idx" ON "resource_access_grants"("expires_at");

-- CreateIndex
CREATE INDEX "resource_access_grants_revoked_at_idx" ON "resource_access_grants"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "resource_access_grants_active_unique_idx" ON "resource_access_grants"("resource_type", "resource_id", "grantee_type", "grantee_id", "grant_type") WHERE "revoked_at" IS NULL;

-- CreateIndex
CREATE INDEX "achievements_department_id_status_idx" ON "achievements"("department_id", "status");

-- CreateIndex
CREATE INDEX "achievements_owner_user_id_status_idx" ON "achievements"("owner_user_id", "status");

-- CreateIndex
CREATE INDEX "achievements_type_status_idx" ON "achievements"("type", "status");

-- CreateIndex
CREATE INDEX "achievements_secret_level_idx" ON "achievements"("secret_level");

-- CreateIndex
CREATE UNIQUE INDEX "paper_details_doi_normalized_key" ON "paper_details"("doi_normalized");

-- CreateIndex
CREATE INDEX "paper_details_publish_year_idx" ON "paper_details"("publish_year");

-- CreateIndex
CREATE INDEX "paper_details_journal_idx" ON "paper_details"("journal");

-- CreateIndex
CREATE UNIQUE INDEX "patent_details_application_no_normalized_key" ON "patent_details"("application_no_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "patent_details_grant_no_normalized_key" ON "patent_details"("grant_no_normalized");

-- CreateIndex
CREATE INDEX "patent_details_legal_status_idx" ON "patent_details"("legal_status");

-- CreateIndex
CREATE INDEX "patent_details_next_fee_date_idx" ON "patent_details"("next_fee_date");

-- CreateIndex
CREATE UNIQUE INDEX "software_copyright_details_registration_no_normalized_key" ON "software_copyright_details"("registration_no_normalized");

-- CreateIndex
CREATE INDEX "software_copyright_details_software_type_idx" ON "software_copyright_details"("software_type");

-- CreateIndex
CREATE INDEX "software_copyright_details_register_date_idx" ON "software_copyright_details"("register_date");

-- CreateIndex
CREATE INDEX "achievement_contributors_achievement_id_idx" ON "achievement_contributors"("achievement_id");

-- CreateIndex
CREATE INDEX "achievement_contributors_user_id_idx" ON "achievement_contributors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_contributors_achievement_id_contributor_type_so_key" ON "achievement_contributors"("achievement_id", "contributor_type", "sort_order");

-- CreateIndex
CREATE INDEX "workflow_instances_target_type_target_id_idx" ON "workflow_instances"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "workflow_instances_target_type_target_id_status_idx" ON "workflow_instances"("target_type", "target_id", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_instances_active_target_unique_idx" ON "workflow_instances"("target_type", "target_id") WHERE "status" = 'ACTIVE'::"WorkflowInstanceStatus";

-- CreateIndex
CREATE INDEX "workflow_tasks_assignee_id_status_idx" ON "workflow_tasks"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "workflow_tasks_instance_id_status_idx" ON "workflow_tasks"("instance_id", "status");

-- CreateIndex
CREATE INDEX "workflow_actions_instance_id_idx" ON "workflow_actions"("instance_id");

-- CreateIndex
CREATE INDEX "workflow_actions_actor_id_idx" ON "workflow_actions"("actor_id");

-- CreateIndex
CREATE INDEX "workflow_actions_created_at_idx" ON "workflow_actions"("created_at");

-- CreateIndex
CREATE INDEX "fee_records_due_date_pay_status_idx" ON "fee_records"("due_date", "pay_status");

-- CreateIndex
CREATE INDEX "fee_records_achievement_id_idx" ON "fee_records"("achievement_id");

-- CreateIndex
CREATE INDEX "fee_records_department_id_idx" ON "fee_records"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_records_achievement_id_fee_type_due_date_key" ON "fee_records"("achievement_id", "fee_type", "due_date");

-- CreateIndex
CREATE INDEX "reminder_tasks_receiver_id_status_idx" ON "reminder_tasks"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "reminder_tasks_remind_date_status_idx" ON "reminder_tasks"("remind_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_tasks_target_type_target_id_remind_date_remind_lev_key" ON "reminder_tasks"("target_type", "target_id", "remind_date", "remind_level", "receiver_id");

-- CreateIndex
CREATE INDEX "notifications_receiver_id_status_idx" ON "notifications"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "notifications_channel_status_idx" ON "notifications"("channel", "status");

-- CreateIndex
CREATE INDEX "attachments_relation_type_relation_id_idx" ON "attachments"("relation_type", "relation_id");

-- CreateIndex
CREATE INDEX "attachments_uploader_id_idx" ON "attachments"("uploader_id");

-- CreateIndex
CREATE INDEX "attachments_secret_level_idx" ON "attachments"("secret_level");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_relation_type_relation_id_file_name_version_key" ON "attachments"("relation_type", "relation_id", "file_name", "version");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_trace_id_idx" ON "audit_logs"("trace_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_integrations_code_key" ON "api_integrations"("code");

-- CreateIndex
CREATE INDEX "api_integrations_enabled_idx" ON "api_integrations"("enabled");

-- CreateIndex
CREATE INDEX "api_integrations_provider_idx" ON "api_integrations"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "api_call_logs_request_id_key" ON "api_call_logs"("request_id");

-- CreateIndex
CREATE INDEX "api_call_logs_integration_code_created_at_idx" ON "api_call_logs"("integration_code", "created_at");

-- CreateIndex
CREATE INDEX "api_call_logs_status_idx" ON "api_call_logs"("status");

-- CreateIndex
CREATE INDEX "search_logs_user_id_created_at_idx" ON "search_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "search_logs_created_at_idx" ON "search_logs"("created_at");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_details" ADD CONSTRAINT "paper_details_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patent_details" ADD CONSTRAINT "patent_details_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_copyright_details" ADD CONSTRAINT "software_copyright_details_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_contributors" ADD CONSTRAINT "achievement_contributors_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_contributors" ADD CONSTRAINT "achievement_contributors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "workflow_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_tasks" ADD CONSTRAINT "reminder_tasks_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_department_id_fkey" FOREIGN KEY ("actor_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_call_logs" ADD CONSTRAINT "api_call_logs_integration_code_fkey" FOREIGN KEY ("integration_code") REFERENCES "api_integrations"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
