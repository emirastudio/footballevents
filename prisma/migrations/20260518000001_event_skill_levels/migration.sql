-- Multi-select skill levels on Event (mirrors ageGroups). The legacy single
-- "skillLevel" column is kept and stays in sync with skillLevels[0].
ALTER TABLE "Event" ADD COLUMN "skillLevels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: seed the array from the existing single value.
UPDATE "Event" SET "skillLevels" = ARRAY["skillLevel"::text];
