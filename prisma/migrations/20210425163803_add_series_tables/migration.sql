-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('ENDED', 'CANCELLED', 'RETURNING');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('ENDED', 'CONTINUING');

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "tmdbId" TEXT NOT NULL,
    "imdbId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstAired" TIMESTAMP(3),
    "status" "SeriesStatus" NOT NULL,
    "overview" TEXT,
    "posterUrl" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "SeasonStatus" NOT NULL,
    "firstAired" TIMESTAMP(3),
    "overview" TEXT,
    "posterUrl" TEXT,
    "seriesId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "firstAired" TIMESTAMP(3),
    "overview" TEXT,
    "stillUrl" TEXT,
    "seasonId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Season" ADD FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
