-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "divisionId" TEXT;

-- CreateTable
CREATE TABLE "EventDivision" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MIXED',
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'ALL_LEVELS',
    "format" TEXT NOT NULL,
    "priceFrom" DECIMAL(10,2),
    "priceTo" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "maxTeams" INTEGER,
    "spotsLeft" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3),
    "externalUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventDivision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDivision_eventId_order_idx" ON "EventDivision"("eventId", "order");

-- CreateIndex
CREATE INDEX "Booking_divisionId_idx" ON "Booking"("divisionId");

-- AddForeignKey
ALTER TABLE "EventDivision" ADD CONSTRAINT "EventDivision_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "EventDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
