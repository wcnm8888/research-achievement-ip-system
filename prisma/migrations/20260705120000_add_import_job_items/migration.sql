-- Add row-level safe import job item history storage without backfill or writer wiring.
CREATE TYPE "ImportJobItemPlannedAction" AS ENUM ('CREATE', 'CREATE_PENDING_USER', 'CREATE_DRAFT', 'SKIP', 'BLOCK');

CREATE TYPE "ImportJobItemStatus" AS ENUM ('PENDING', 'APPLIED', 'SKIPPED', 'BLOCKED', 'FAILED');

CREATE TYPE "ImportJobItemTargetType" AS ENUM ('DEPARTMENT', 'USER', 'ACHIEVEMENT');

CREATE TABLE "import_job_items" (
    "job_id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "planned_action" "ImportJobItemPlannedAction" NOT NULL,
    "status" "ImportJobItemStatus" NOT NULL DEFAULT 'PENDING',
    "safe_code" VARCHAR(120),
    "target_type" "ImportJobItemTargetType" NOT NULL,
    "target_id" UUID,

    CONSTRAINT "import_job_items_pkey" PRIMARY KEY ("run_id", "row_number")
);

CREATE INDEX "import_job_items_job_id_idx" ON "import_job_items"("job_id");
CREATE INDEX "import_job_items_run_id_idx" ON "import_job_items"("run_id");
CREATE INDEX "import_job_items_job_row_number_idx" ON "import_job_items"("job_id", "row_number");
CREATE INDEX "import_job_items_status_idx" ON "import_job_items"("status");
CREATE INDEX "import_job_items_safe_code_idx" ON "import_job_items"("safe_code");
CREATE INDEX "import_job_items_target_type_idx" ON "import_job_items"("target_type");

ALTER TABLE "import_job_items"
  ADD CONSTRAINT "import_job_items_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "import_jobs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "import_job_items"
  ADD CONSTRAINT "import_job_items_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "import_runs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
