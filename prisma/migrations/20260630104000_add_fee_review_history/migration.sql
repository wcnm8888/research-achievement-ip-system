-- Add append-only business timeline for fee review approve/reject events.
CREATE TYPE "FeeReviewHistoryAction" AS ENUM ('APPROVE', 'REJECT');

CREATE TABLE "fee_review_history" (
  "id" UUID NOT NULL,
  "fee_record_id" UUID NOT NULL,
  "department_id" UUID NOT NULL,
  "reviewer_id" UUID NOT NULL,
  "action" "FeeReviewHistoryAction" NOT NULL,
  "from_status" "FeeReviewStatus" NOT NULL,
  "to_status" "FeeReviewStatus" NOT NULL,
  "reason" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fee_review_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fee_review_history_fee_record_id_created_at_idx"
  ON "fee_review_history"("fee_record_id", "created_at");

CREATE INDEX "fee_review_history_department_id_created_at_idx"
  ON "fee_review_history"("department_id", "created_at");

CREATE INDEX "fee_review_history_reviewer_id_created_at_idx"
  ON "fee_review_history"("reviewer_id", "created_at");

ALTER TABLE "fee_review_history"
  ADD CONSTRAINT "fee_review_history_fee_record_id_fkey"
  FOREIGN KEY ("fee_record_id") REFERENCES "fee_records"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_review_history"
  ADD CONSTRAINT "fee_review_history_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_review_history"
  ADD CONSTRAINT "fee_review_history_reviewer_id_fkey"
  FOREIGN KEY ("reviewer_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
