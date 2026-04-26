-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "whatsappUrl" TEXT,
ADD COLUMN     "xUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;
