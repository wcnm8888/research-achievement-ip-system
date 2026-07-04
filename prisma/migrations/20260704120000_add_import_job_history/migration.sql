-- Add durable import job history and idempotency ledger tables.
CREATE TYPE "ImportFamily" AS ENUM ('DEPARTMENT', 'USER_ACCOUNT', 'ACHIEVEMENT');

CREATE TYPE "ImportMode" AS ENUM ('CREATE_ONLY', 'CREATE_ONLY_PENDING_NO_CREDENTIAL', 'CREATE_DRAFT_ONLY');

CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'REJECTED');

CREATE TYPE "ImportRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'REJECTED');

CREATE TYPE "ImportRunTrigger" AS ENUM ('INITIAL_SUBMIT', 'RETRY_AFTER_FAILED', 'OPERATOR_REPLAY_CHECK');

CREATE TYPE "ImportFailureStage" AS ENUM ('ACCEPTANCE', 'VALIDATION', 'TRANSACTION', 'RESPONSE', 'POST_APPLY_RECONCILIATION');

CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "idempotency_key_hash" VARCHAR(128) NOT NULL,
    "import_family" "ImportFamily" NOT NULL,
    "mode" "ImportMode" NOT NULL,
    "achievement_type" "AchievementType",
    "target_environment" VARCHAR(64) NOT NULL,
    "scope_type" VARCHAR(64) NOT NULL,
    "scope_hash" VARCHAR(128) NOT NULL,
    "file_fingerprint" VARCHAR(128) NOT NULL,
    "file_size_bytes" INTEGER,
    "operator_user_id" UUID,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "latest_run_id" UUID,
    "accepted_row_count" INTEGER NOT NULL DEFAULT 0,
    "created_business_count" INTEGER NOT NULL DEFAULT 0,
    "created_companion_count" INTEGER NOT NULL DEFAULT 0,
    "audit_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "safe_error_codes" JSONB,
    "safe_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_runs" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "trigger" "ImportRunTrigger" NOT NULL DEFAULT 'INITIAL_SUBMIT',
    "status" "ImportRunStatus" NOT NULL DEFAULT 'PENDING',
    "operator_user_id" UUID,
    "request_fingerprint" VARCHAR(128),
    "validation_summary" JSONB,
    "apply_summary" JSONB,
    "failure_code" VARCHAR(120),
    "failure_stage" "ImportFailureStage",
    "audit_log_ids" JSONB,
    "completed_business_transaction_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "import_jobs_idempotency_key" ON "import_jobs"("target_environment", "scope_type", "scope_hash", "idempotency_key_hash");
CREATE INDEX "import_jobs_family_mode_status_idx" ON "import_jobs"("import_family", "mode", "status");
CREATE INDEX "import_jobs_operator_created_idx" ON "import_jobs"("operator_user_id", "created_at");
CREATE INDEX "import_jobs_created_at_idx" ON "import_jobs"("created_at");
CREATE INDEX "import_jobs_completed_at_idx" ON "import_jobs"("completed_at");
CREATE INDEX "import_jobs_latest_run_id_idx" ON "import_jobs"("latest_run_id");

CREATE UNIQUE INDEX "import_runs_job_attempt_key" ON "import_runs"("job_id", "attempt_no");
CREATE INDEX "import_runs_job_status_idx" ON "import_runs"("job_id", "status");
CREATE INDEX "import_runs_operator_created_idx" ON "import_runs"("operator_user_id", "created_at");
CREATE INDEX "import_runs_status_created_idx" ON "import_runs"("status", "created_at");
CREATE INDEX "import_runs_created_at_idx" ON "import_runs"("created_at");
CREATE INDEX "import_runs_finished_at_idx" ON "import_runs"("finished_at");

ALTER TABLE "import_runs"
  ADD CONSTRAINT "import_runs_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "import_jobs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
