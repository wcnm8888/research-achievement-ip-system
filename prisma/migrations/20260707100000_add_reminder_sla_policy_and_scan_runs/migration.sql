CREATE TABLE "reminder_sla_policy_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_code" VARCHAR(120) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scan_window_hours" INTEGER NOT NULL DEFAULT 24,
    "cooldown_hours" INTEGER NOT NULL DEFAULT 24,
    "levels" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_sla_policy_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reminder_sla_scan_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_code" VARCHAR(120) NOT NULL,
    "actor_user_id" UUID,
    "actor_department_id" UUID,
    "scan_scope" VARCHAR(64) NOT NULL DEFAULT 'ALL_RECEIVERS',
    "status" VARCHAR(32) NOT NULL,
    "scanned_count" INTEGER NOT NULL DEFAULT 0,
    "escalated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "safe_summary" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_sla_scan_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reminder_sla_policy_configs_policy_code_key" ON "reminder_sla_policy_configs"("policy_code");
CREATE INDEX "reminder_sla_policy_configs_enabled_idx" ON "reminder_sla_policy_configs"("enabled");
CREATE INDEX "reminder_sla_policy_configs_updated_at_idx" ON "reminder_sla_policy_configs"("updated_at");
CREATE INDEX "reminder_sla_scan_runs_policy_code_idx" ON "reminder_sla_scan_runs"("policy_code");
CREATE INDEX "reminder_sla_scan_runs_status_idx" ON "reminder_sla_scan_runs"("status");
CREATE INDEX "reminder_sla_scan_runs_started_at_idx" ON "reminder_sla_scan_runs"("started_at");
