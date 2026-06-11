-- User-submitted bug / feedback reports from the floating "Report an issue"
-- button. Anonymous reporters allowed: userId is nullable; reporterEmail
-- stores their address when they choose to give one.

-- CreateEnum
CREATE TYPE "BugReportCategory" AS ENUM ('BUG', 'TRANSLATION', 'WRONG_INFO', 'FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "BugReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'WONT_FIX');

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reporterEmail" TEXT,
    "category" "BugReportCategory" NOT NULL DEFAULT 'BUG',
    "message" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "userAgent" TEXT,
    "consoleErrors" JSONB,
    "sentryEventId" TEXT,
    "screenshotData" TEXT,
    "status" "BugReportStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugReport_status_createdAt_idx" ON "BugReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BugReport_userId_idx" ON "BugReport"("userId");

-- CreateIndex
CREATE INDEX "BugReport_category_idx" ON "BugReport"("category");

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
