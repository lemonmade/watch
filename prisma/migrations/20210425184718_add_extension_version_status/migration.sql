/*
  Warnings:

  - Added the required column `status` to the `ClipsExtensionVersion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClipsExtensionVersionStatus" AS ENUM ('PUBLISHED', 'BUILDING');

-- AlterTable
ALTER TABLE "ClipsExtensionVersion" ADD COLUMN     "status" "ClipsExtensionVersionStatus" NOT NULL;
