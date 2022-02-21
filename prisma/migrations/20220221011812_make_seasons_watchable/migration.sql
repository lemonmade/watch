-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "seasonId" TEXT,
ALTER COLUMN "episodeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Watch" ADD FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
