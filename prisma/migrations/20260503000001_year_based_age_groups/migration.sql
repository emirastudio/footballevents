-- Migration: switch ageGroups from AgeGroup enum to String (birth years)
-- Event.ageGroups: AgeGroup[] → text[]
ALTER TABLE "Event" ALTER COLUMN "ageGroups" TYPE text[] USING ageGroups::text[];

-- EventDivision.ageGroup: AgeGroup → text
ALTER TABLE "EventDivision" ALTER COLUMN "ageGroup" TYPE text USING ageGroup::text;

-- Drop the AgeGroup enum (no longer needed)
DROP TYPE IF EXISTS "AgeGroup";
