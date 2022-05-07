-- DropForeignKey
ALTER TABLE "App" DROP CONSTRAINT "App_userId_fkey";

-- DropForeignKey
ALTER TABLE "AppInstallation" DROP CONSTRAINT "AppInstallation_appId_fkey";

-- DropForeignKey
ALTER TABLE "AppInstallation" DROP CONSTRAINT "AppInstallation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClipsExtension" DROP CONSTRAINT "ClipsExtension_appId_fkey";

-- DropForeignKey
ALTER TABLE "ClipsExtensionInstallation" DROP CONSTRAINT "ClipsExtensionInstallation_appInstallationId_fkey";

-- DropForeignKey
ALTER TABLE "ClipsExtensionInstallation" DROP CONSTRAINT "ClipsExtensionInstallation_extensionId_fkey";

-- DropForeignKey
ALTER TABLE "ClipsExtensionInstallation" DROP CONSTRAINT "ClipsExtensionInstallation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClipsExtensionVersion" DROP CONSTRAINT "ClipsExtensionVersion_extensionId_fkey";

-- DropForeignKey
ALTER TABLE "Episode" DROP CONSTRAINT "Episode_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "GithubAccount" DROP CONSTRAINT "GithubAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "List" DROP CONSTRAINT "List_userId_fkey";

-- DropForeignKey
ALTER TABLE "ListItem" DROP CONSTRAINT "ListItem_listId_fkey";

-- DropForeignKey
ALTER TABLE "PersonalAccessToken" DROP CONSTRAINT "PersonalAccessToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Season" DROP CONSTRAINT "Season_seriesId_fkey";

-- DropForeignKey
ALTER TABLE "SeriesSubscription" DROP CONSTRAINT "SeriesSubscription_seriesId_fkey";

-- DropForeignKey
ALTER TABLE "SeriesSubscription" DROP CONSTRAINT "SeriesSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Skip" DROP CONSTRAINT "Skip_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "Skip" DROP CONSTRAINT "Skip_userId_fkey";

-- DropForeignKey
ALTER TABLE "Watch" DROP CONSTRAINT "Watch_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "Watch" DROP CONSTRAINT "Watch_userId_fkey";

-- DropForeignKey
ALTER TABLE "WatchThrough" DROP CONSTRAINT "WatchThrough_seriesId_fkey";

-- DropForeignKey
ALTER TABLE "WatchThrough" DROP CONSTRAINT "WatchThrough_userId_fkey";

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "handle" TEXT;

-- AddForeignKey
ALTER TABLE "GithubAccount" ADD CONSTRAINT "GithubAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSubscription" ADD CONSTRAINT "SeriesSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSubscription" ADD CONSTRAINT "SeriesSubscription_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchThrough" ADD CONSTRAINT "WatchThrough_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchThrough" ADD CONSTRAINT "WatchThrough_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skip" ADD CONSTRAINT "Skip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skip" ADD CONSTRAINT "Skip_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "App" ADD CONSTRAINT "App_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD CONSTRAINT "AppInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD CONSTRAINT "AppInstallation_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtension" ADD CONSTRAINT "ClipsExtension_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionVersion" ADD CONSTRAINT "ClipsExtensionVersion_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "ClipsExtension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionInstallation" ADD CONSTRAINT "ClipsExtensionInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionInstallation" ADD CONSTRAINT "ClipsExtensionInstallation_appInstallationId_fkey" FOREIGN KEY ("appInstallationId") REFERENCES "AppInstallation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionInstallation" ADD CONSTRAINT "ClipsExtensionInstallation_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "ClipsExtension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAccessToken" ADD CONSTRAINT "PersonalAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Episode.seasonId_number_unique" RENAME TO "Episode_seasonId_number_key";

-- RenameIndex
ALTER INDEX "GithubAccount.userId_unique" RENAME TO "GithubAccount_userId_key";

-- RenameIndex
ALTER INDEX "PersonalAccessToken.token_unique" RENAME TO "PersonalAccessToken_token_key";

-- RenameIndex
ALTER INDEX "Season.seriesId_number_unique" RENAME TO "Season_seriesId_number_key";

-- RenameIndex
ALTER INDEX "SeriesSubscription.seriesId_userId_unique" RENAME TO "SeriesSubscription_seriesId_userId_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";

-- RenameIndex
ALTER INDEX "User.watchLaterId_unique" RENAME TO "User_watchLaterId_key";
