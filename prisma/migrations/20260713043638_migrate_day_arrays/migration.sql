-- Add array columns with default empty
ALTER TABLE "Task"
  ADD COLUMN "daysOfWeek"  INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "daysOfMonth" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- Backfill from old scalar columns
UPDATE "Task"
SET "daysOfWeek" = ARRAY["dayOfWeek"]
WHERE "dayOfWeek" IS NOT NULL;

UPDATE "Task"
SET "daysOfMonth" = ARRAY["dayOfMonth"]
WHERE "dayOfMonth" IS NOT NULL;

-- Drop old scalar columns
ALTER TABLE "Task"
  DROP COLUMN "dayOfWeek",
  DROP COLUMN "dayOfMonth";
