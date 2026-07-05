-- Step 84 local schema support for achievement conversion ledger.
-- This migration defines internal structured ledger records only; it does not
-- integrate with contract signing, finance, legal, payment, or external systems.

ALTER TYPE "ResourceType" ADD VALUE IF NOT EXISTS 'ACHIEVEMENT_CONVERSION';

CREATE TYPE "AchievementConversionType" AS ENUM (
  'LICENSE',
  'TRANSFER',
  'COOPERATION',
  'INDUSTRIALIZATION',
  'OTHER'
);

CREATE TYPE "AchievementConversionStatus" AS ENUM (
  'LEAD_INTENT',
  'CONTRACTING',
  'SIGNED',
  'PAID',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "achievement_conversions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "achievement_id" UUID NOT NULL,
  "department_id" UUID NOT NULL,
  "conversion_type" "AchievementConversionType" NOT NULL,
  "counterparty_name" VARCHAR(200) NOT NULL,
  "contract_amount" DECIMAL(14, 2),
  "revenue_amount" DECIMAL(14, 2),
  "status" "AchievementConversionStatus" NOT NULL DEFAULT 'LEAD_INTENT',
  "conversion_date" DATE,
  "benefit_distribution_summary" VARCHAR(1000),
  "remarks" VARCHAR(1000),
  "created_by_id" UUID,
  "updated_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "achievement_conversions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "achievement_conversions_achievement_id_fkey"
    FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "achievement_conversions_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "achievement_conversions_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "achievement_conversions_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "achievement_conversions_achievement_id_status_idx"
  ON "achievement_conversions"("achievement_id", "status");

CREATE INDEX "achievement_conversions_department_id_status_idx"
  ON "achievement_conversions"("department_id", "status");

CREATE INDEX "achievement_conversions_conversion_type_idx"
  ON "achievement_conversions"("conversion_type");

CREATE INDEX "achievement_conversions_conversion_date_idx"
  ON "achievement_conversions"("conversion_date");
