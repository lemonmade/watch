-- AlterTable
ALTER TABLE "ClipsExtension" ADD COLUMN     "activeVersionId" TEXT;

-- AddForeignKey
ALTER TABLE "ClipsExtension" ADD FOREIGN KEY ("activeVersionId") REFERENCES "ClipsExtensionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
