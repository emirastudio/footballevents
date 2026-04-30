-- Public profile fields on User
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "profilePublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;

-- Username must be unique when set
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
