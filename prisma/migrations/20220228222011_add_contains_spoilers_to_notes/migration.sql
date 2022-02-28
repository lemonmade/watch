-- AlterTable
ALTER TABLE "Skip" ADD COLUMN     "containsSpoilers" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "containsSpoilers" BOOLEAN NOT NULL DEFAULT false;
