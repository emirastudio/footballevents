-- Add activityTypes multi-value column to Organizer
ALTER TABLE "Organizer"
  ADD COLUMN IF NOT EXISTS "activityTypes" "EventType"[] NOT NULL DEFAULT '{}'::"EventType"[];
