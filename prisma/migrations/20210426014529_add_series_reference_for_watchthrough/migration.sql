/*
  Warnings:

  - Added the required column `seriesId` to the `WatchThrough` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WatchThrough" ADD COLUMN     "seriesId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "WatchThrough" ADD FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
