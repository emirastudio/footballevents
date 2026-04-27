-- Per-locale rich content for events (program/faq are already JSONB; included/notIncluded need new columns).
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "includedI18n"    JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "notIncludedI18n" JSONB;
