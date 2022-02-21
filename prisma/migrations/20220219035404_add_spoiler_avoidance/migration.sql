-- CreateEnum
CREATE TYPE "SpoilerAvoidance" AS ENUM ('NONE', 'UPCOMING', 'EVERYTHING');

-- AlterTable
ALTER TABLE "SeriesSubscription" ADD COLUMN     "spoilerAvoidance" "SpoilerAvoidance" NOT NULL DEFAULT E'NONE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "spoilerAvoidance" "SpoilerAvoidance" NOT NULL DEFAULT E'UPCOMING';

-- AlterTable
ALTER TABLE "WatchThrough" ADD COLUMN     "spoilerAvoidance" "SpoilerAvoidance" NOT NULL DEFAULT E'UPCOMING';
