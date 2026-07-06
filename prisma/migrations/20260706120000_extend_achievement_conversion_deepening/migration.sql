-- Step 108 local schema support for achievement conversion deepening.
-- This migration is additive only. It keeps existing Step 84 ledger rows and
-- does not integrate with real contract, legal, finance, payment, invoice,
-- settlement, reconciliation, or external systems.

CREATE TYPE "AchievementConversionContractStatus" AS ENUM (
  'DRAFT',
  'SIGNED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "AchievementConversionRevenueStatus" AS ENUM (
  'UNPAID',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'WAIVED'
);

CREATE TYPE "AchievementConversionEvaluationEffect" AS ENUM (
  'NOT_EVALUATED',
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
  'MIXED'
);

ALTER TABLE "achievement_conversions"
  ADD COLUMN "contract_status" "AchievementConversionContractStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "revenue_status" "AchievementConversionRevenueStatus" NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN "revenue_due_date" DATE,
  ADD COLUMN "revenue_received_date" DATE,
  ADD COLUMN "benefit_distribution_json" JSONB,
  ADD COLUMN "evaluation_effect" "AchievementConversionEvaluationEffect" NOT NULL DEFAULT 'NOT_EVALUATED',
  ADD COLUMN "evaluation_summary" VARCHAR(1000),
  ADD COLUMN "evaluation_date" DATE;

CREATE INDEX "achievement_conversions_department_id_contract_status_idx"
  ON "achievement_conversions"("department_id", "contract_status");

CREATE INDEX "achievement_conversions_department_id_revenue_status_idx"
  ON "achievement_conversions"("department_id", "revenue_status");

CREATE INDEX "achievement_conversions_revenue_due_date_idx"
  ON "achievement_conversions"("revenue_due_date");

CREATE INDEX "achievement_conversions_department_id_evaluation_effect_idx"
  ON "achievement_conversions"("department_id", "evaluation_effect");
