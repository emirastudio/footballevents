-- Flag machine-translated event locales (auto-filled from EN), so the UI can
-- badge them and so re-runs never overwrite organizer-provided translations.
ALTER TABLE "EventTranslation" ADD COLUMN "auto" BOOLEAN NOT NULL DEFAULT false;
