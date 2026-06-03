-- Custom registration form builder: per-event field definitions.
-- Submission answers reuse the existing Booking.customFields JSON column.
ALTER TABLE "Event" ADD COLUMN "registrationForm" JSONB;
