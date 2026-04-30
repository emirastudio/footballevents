-- Track the organizer who first created each venue so they can always
-- edit it, even before any events are linked.
ALTER TABLE "Venue" ADD COLUMN "createdByOrganizerId" TEXT;

ALTER TABLE "Venue" ADD CONSTRAINT "Venue_createdByOrganizerId_fkey"
  FOREIGN KEY ("createdByOrganizerId") REFERENCES "Organizer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Venue_createdByOrganizerId_idx" ON "Venue"("createdByOrganizerId");
