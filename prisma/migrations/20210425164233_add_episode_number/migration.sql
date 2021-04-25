/*
  Warnings:

  - Added the required column `number` to the `Episode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "number" INTEGER NOT NULL;
