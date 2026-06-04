-- Add Clubs domain: Club, ClubTranslation, ClubTeam, ClubUsage, Rfq.
-- Extend Booking with optional club context + monetization hooks.
-- See: docs/architecture/0001-clubs.md

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('OPEN', 'CLOSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "countryCode" TEXT NOT NULL,
    "cityId" TEXT,
    "foundedYear" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "xUrl" TEXT,
    "tiktokUrl" TEXT,
    "youtubeUrl" TEXT,
    "whatsappUrl" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionEndsAt" TIMESTAMP(3),
    "quotaApplicationsPerMonth" INTEGER,
    "quotaRfqPerMonth" INTEGER,
    "quotaFavoritesMax" INTEGER,
    "quotaTeamsMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_userId_key" ON "Club"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Club_stripeCustomerId_key" ON "Club"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Club_slug_idx" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_countryCode_idx" ON "Club"("countryCode");

-- CreateIndex
CREATE INDEX "Club_cityId_idx" ON "Club"("cityId");

-- CreateTable
CREATE TABLE "ClubTranslation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "about" TEXT,
    "tagline" TEXT,

    CONSTRAINT "ClubTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubTranslation_clubId_locale_key" ON "ClubTranslation"("clubId", "locale");

-- CreateTable
CREATE TABLE "ClubTeam" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MIXED',
    "format" TEXT,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'ALL_LEVELS',
    "birthYearFrom" INTEGER,
    "birthYearTo" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubTeam_clubId_idx" ON "ClubTeam"("clubId");

-- CreateTable
CREATE TABLE "ClubUsage" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "applicationsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "rfqThisMonth" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationsTotal" INTEGER NOT NULL DEFAULT 0,
    "rfqTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubUsage_clubId_key" ON "ClubUsage"("clubId");

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "teamId" TEXT,
    "eventType" "EventType" NOT NULL,
    "ageGroup" TEXT,
    "format" TEXT,
    "skillLevel" "SkillLevel",
    "gender" "Gender",
    "targetCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetRegion" TEXT,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "durationDays" INTEGER,
    "budgetPerTeamCents" INTEGER,
    "currency" TEXT,
    "comment" TEXT,
    "status" "RfqStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rfq_status_eventType_idx" ON "Rfq"("status", "eventType");

-- CreateIndex
CREATE INDEX "Rfq_clubId_idx" ON "Rfq"("clubId");

-- CreateIndex
CREATE INDEX "Rfq_expiresAt_idx" ON "Rfq"("expiresAt");

-- AlterTable Booking — add club context + monetization hooks (no-op defaults).
ALTER TABLE "Booking" ADD COLUMN "clubId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "clubTeamId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "visibleToOrganizer" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Booking_eventId_priority_createdAt_idx" ON "Booking"("eventId", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_clubId_status_idx" ON "Booking"("clubId", "status");

-- CreateIndex
CREATE INDEX "Booking_clubTeamId_idx" ON "Booking"("clubTeamId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTranslation" ADD CONSTRAINT "ClubTranslation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTeam" ADD CONSTRAINT "ClubTeam_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubUsage" ADD CONSTRAINT "ClubUsage_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ClubTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clubTeamId_fkey" FOREIGN KEY ("clubTeamId") REFERENCES "ClubTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
