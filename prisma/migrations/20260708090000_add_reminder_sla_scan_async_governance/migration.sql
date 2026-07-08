ALTER TABLE "reminder_sla_scan_runs"
ADD COLUMN "trigger_type" VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "idempotency_key" VARCHAR(160),
ADD COLUMN "lock_key" VARCHAR(120),
ADD COLUMN "locked_at" TIMESTAMP(3),
ADD COLUMN "locked_until" TIMESTAMP(3),
ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "failure_reason" VARCHAR(160),
ADD COLUMN "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "queued_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "reminder_sla_scan_runs_idempotency_key_key"
ON "reminder_sla_scan_runs"("idempotency_key");

CREATE INDEX "reminder_sla_scan_runs_lock_key_status_idx"
ON "reminder_sla_scan_runs"("lock_key", "status");

CREATE INDEX "reminder_sla_scan_runs_queued_at_idx"
ON "reminder_sla_scan_runs"("queued_at");

CREATE UNIQUE INDEX "reminder_sla_scan_runs_running_lock_key_key"
ON "reminder_sla_scan_runs"("lock_key")
WHERE "status" = 'RUNNING' AND "lock_key" IS NOT NULL;
