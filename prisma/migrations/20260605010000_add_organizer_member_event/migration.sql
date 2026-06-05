-- Per-event ACL for OrganizerMember. Presence of one or more rows for a member
-- switches their access from "all events" to "only listed events" — empty set
-- preserves backward-compatible "no restriction" behavior for existing members.

-- CreateTable
CREATE TABLE "OrganizerMemberEvent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerMemberEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerMemberEvent_memberId_eventId_key" ON "OrganizerMemberEvent"("memberId", "eventId");

-- CreateIndex
CREATE INDEX "OrganizerMemberEvent_eventId_idx" ON "OrganizerMemberEvent"("eventId");

-- AddForeignKey
ALTER TABLE "OrganizerMemberEvent" ADD CONSTRAINT "OrganizerMemberEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "OrganizerMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerMemberEvent" ADD CONSTRAINT "OrganizerMemberEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
