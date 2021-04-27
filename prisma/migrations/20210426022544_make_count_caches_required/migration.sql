/*
  Warnings:

  - Made the column `episodeCount` on table `Season` required. This step will fail if there are existing NULL values in that column.
  - Made the column `seasonCount` on table `Series` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Season" ALTER COLUMN "episodeCount" SET NOT NULL;

-- AlterTable
ALTER TABLE "Series" ALTER COLUMN "seasonCount" SET NOT NULL;
