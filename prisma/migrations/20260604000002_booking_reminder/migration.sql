-- Track when the "application still waiting" reminder was emailed to the
-- organizer so the 3-day reminder cron never sends the same reminder twice.
ALTER TABLE "Booking" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
