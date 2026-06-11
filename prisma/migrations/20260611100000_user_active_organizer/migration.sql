-- Add a per-user "currently active" organizer pointer for the multi-org switcher.
-- Nullable: existing users default to "no preference" → the access lookup falls
-- back to the user's owned org first, then any membership. The column is NOT a
-- foreign key so deleting an Organizer never blocks; orphaned ids are detected
-- at read-time in getOrganizerForUser() and silently cleared.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "activeOrganizerId" TEXT;
