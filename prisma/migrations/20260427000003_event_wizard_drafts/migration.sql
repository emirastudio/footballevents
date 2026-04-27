-- Allow partial drafts so the wizard can save progress on every step.
ALTER TABLE "Event" ALTER COLUMN "startDate" DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "endDate"   DROP NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "countryCode" DROP NOT NULL;

-- Track which wizard step the organizer last reached (for "stuck on step N" insight).
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "wizardStep" INTEGER NOT NULL DEFAULT 1;
