-- CreateEnum
CREATE TYPE "WaitlistRole" AS ENUM ('PARENT', 'COACH', 'CLUB_MANAGER', 'PLAYER', 'OTHER');

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_countryCode_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WaitlistRole" NOT NULL,
    "countryCode" TEXT,
    "cityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Waitlist_countryCode_idx" ON "Waitlist"("countryCode");

-- CreateIndex
CREATE INDEX "Waitlist_email_idx" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_stripeCustomerId_key" ON "Organizer"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

