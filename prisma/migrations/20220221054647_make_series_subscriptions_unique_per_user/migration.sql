/*
  Warnings:

  - A unique constraint covering the columns `[seriesId,userId]` on the table `SeriesSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SeriesSubscription.seriesId_userId_unique" ON "SeriesSubscription"("seriesId", "userId");
