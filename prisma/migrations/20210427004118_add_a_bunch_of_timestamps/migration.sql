/*
  Warnings:

  - Added the required column `updatedAt` to the `App` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AppInstallation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ClipsExtension` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ClipsExtensionInstallation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ClipsExtensionVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Skip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Watch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "App" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AppInstallation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ClipsExtension" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ClipsExtensionInstallation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ClipsExtensionVersion" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Skip" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "WatchThrough" ALTER COLUMN "updatedAt" DROP DEFAULT;
