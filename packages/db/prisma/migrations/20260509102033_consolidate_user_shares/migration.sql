/*
  Warnings:

  - You are about to drop the `FileShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FileSharedLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FolderShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FolderSharedLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."FileShare" DROP CONSTRAINT "FileShare_fileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FileShare" DROP CONSTRAINT "FileShare_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FileSharedLink" DROP CONSTRAINT "FileSharedLink_fileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FolderShare" DROP CONSTRAINT "FolderShare_folderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FolderShare" DROP CONSTRAINT "FolderShare_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FolderSharedLink" DROP CONSTRAINT "FolderSharedLink_folderId_fkey";

-- DropTable
DROP TABLE "public"."FileShare";

-- DropTable
DROP TABLE "public"."FileSharedLink";

-- DropTable
DROP TABLE "public"."FolderShare";

-- DropTable
DROP TABLE "public"."FolderSharedLink";

-- CreateTable
CREATE TABLE "public"."UserShare" (
    "id" TEXT NOT NULL,
    "permissions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "fileId" TEXT,
    "folderId" TEXT,

    CONSTRAINT "UserShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LinkShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permissions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "fileId" TEXT,
    "folderId" TEXT,

    CONSTRAINT "LinkShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserShare_userId_idx" ON "public"."UserShare"("userId");

-- CreateIndex
CREATE INDEX "UserShare_fileId_idx" ON "public"."UserShare"("fileId");

-- CreateIndex
CREATE INDEX "UserShare_folderId_idx" ON "public"."UserShare"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "UserShare_fileId_userId_key" ON "public"."UserShare"("fileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserShare_folderId_userId_key" ON "public"."UserShare"("folderId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkShare_token_key" ON "public"."LinkShare"("token");

-- CreateIndex
CREATE INDEX "LinkShare_token_idx" ON "public"."LinkShare"("token");

-- CreateIndex
CREATE INDEX "LinkShare_fileId_idx" ON "public"."LinkShare"("fileId");

-- CreateIndex
CREATE INDEX "LinkShare_folderId_idx" ON "public"."LinkShare"("folderId");

-- CreateIndex
CREATE INDEX "LinkShare_expiresAt_idx" ON "public"."LinkShare"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."UserShare" ADD CONSTRAINT "UserShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserShare" ADD CONSTRAINT "UserShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserShare" ADD CONSTRAINT "UserShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkShare" ADD CONSTRAINT "LinkShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkShare" ADD CONSTRAINT "LinkShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
