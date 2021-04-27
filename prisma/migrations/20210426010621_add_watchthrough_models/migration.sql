-- CreateEnum
CREATE TYPE "WatchThroughStatus" AS ENUM ('ONGOING', 'STOPPED', 'FINISHED');

-- CreateTable
CREATE TABLE "WatchThrough" (
    "id" TEXT NOT NULL,
    "from" BYTEA NOT NULL,
    "to" BYTEA NOT NULL,
    "current" BYTEA,
    "status" "WatchThroughStatus" NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watch" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "liked" BOOLEAN,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "watchThroughId" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skip" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "watchThroughId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WatchThrough" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD FOREIGN KEY ("watchThroughId") REFERENCES "WatchThrough"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skip" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skip" ADD FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skip" ADD FOREIGN KEY ("watchThroughId") REFERENCES "WatchThrough"("id") ON DELETE SET NULL ON UPDATE CASCADE;
