-- Add the minimum queryable fee finance review contract without changing payment status semantics.
CREATE TYPE "FeeReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "fee_records"
  ADD COLUMN "review_status" "FeeReviewStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "reviewed_by_id" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMP(3);

CREATE INDEX "fee_records_review_status_idx" ON "fee_records"("review_status");
CREATE INDEX "fee_records_reviewed_by_id_idx" ON "fee_records"("reviewed_by_id");

ALTER TABLE "fee_records"
  ADD CONSTRAINT "fee_records_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
