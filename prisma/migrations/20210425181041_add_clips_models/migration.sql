-- CreateEnum
CREATE TYPE "ClipsApiVersion" AS ENUM ('UNSTABLE');

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppInstallation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipsExtension" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipsExtensionVersion" (
    "id" TEXT NOT NULL,
    "apiVersion" "ClipsApiVersion" NOT NULL,
    "scriptUrl" TEXT,
    "supports" JSONB,
    "translations" JSONB,
    "configurationSchema" JSONB,
    "extensionId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipsExtensionInstallation" (
    "id" TEXT NOT NULL,
    "extensionPoint" TEXT NOT NULL,
    "configuration" JSONB,
    "userId" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "appInstallationId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtension" ADD FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionVersion" ADD FOREIGN KEY ("extensionId") REFERENCES "ClipsExtension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionInstallation" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionInstallation" ADD FOREIGN KEY ("extensionId") REFERENCES "ClipsExtension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipsExtensionInstallation" ADD FOREIGN KEY ("appInstallationId") REFERENCES "AppInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
