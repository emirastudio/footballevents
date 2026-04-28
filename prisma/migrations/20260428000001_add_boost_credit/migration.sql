-- CreateTable
CREATE TABLE "BoostCredit" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "tier" "BoostTier" NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBoostId" TEXT,
    "paymentId" TEXT,
    "source" TEXT,

    CONSTRAINT "BoostCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoostCredit_redeemedBoostId_key" ON "BoostCredit"("redeemedBoostId");

-- CreateIndex
CREATE INDEX "BoostCredit_organizerId_redeemedAt_idx" ON "BoostCredit"("organizerId", "redeemedAt");

-- AddForeignKey
ALTER TABLE "BoostCredit" ADD CONSTRAINT "BoostCredit_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
