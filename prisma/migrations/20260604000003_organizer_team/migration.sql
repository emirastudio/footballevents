-- Organizer team access: staff members + email invitations.
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

CREATE TABLE "OrganizerMember" (
  "id" TEXT NOT NULL,
  "organizerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizerMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizerInvite" (
  "id" TEXT NOT NULL,
  "organizerId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL DEFAULT 'STAFF',
  "token" TEXT NOT NULL,
  "invitedById" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizerInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizerMember_organizerId_userId_key" ON "OrganizerMember"("organizerId", "userId");
CREATE INDEX "OrganizerMember_userId_idx" ON "OrganizerMember"("userId");
CREATE UNIQUE INDEX "OrganizerInvite_token_key" ON "OrganizerInvite"("token");
CREATE INDEX "OrganizerInvite_organizerId_idx" ON "OrganizerInvite"("organizerId");
CREATE INDEX "OrganizerInvite_email_idx" ON "OrganizerInvite"("email");

ALTER TABLE "OrganizerMember" ADD CONSTRAINT "OrganizerMember_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerMember" ADD CONSTRAINT "OrganizerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerInvite" ADD CONSTRAINT "OrganizerInvite_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
