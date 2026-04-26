-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "faq" JSONB,
ADD COLUMN     "included" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notIncluded" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "program" JSONB;

-- CreateTable
CREATE TABLE "OrganizerFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizerFollow_organizerId_idx" ON "OrganizerFollow"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerFollow_userId_organizerId_key" ON "OrganizerFollow"("userId", "organizerId");

-- CreateIndex
CREATE INDEX "EventSave_eventId_idx" ON "EventSave"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSave_userId_eventId_key" ON "EventSave"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "OrganizerFollow" ADD CONSTRAINT "OrganizerFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerFollow" ADD CONSTRAINT "OrganizerFollow_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSave" ADD CONSTRAINT "EventSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSave" ADD CONSTRAINT "EventSave_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
