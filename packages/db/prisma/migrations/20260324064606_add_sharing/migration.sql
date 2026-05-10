/*
  Warnings:

  - You are about to drop the `SharedLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."SharedLink" DROP CONSTRAINT "SharedLink_fileId_fkey";

-- AlterTable
ALTER TABLE "public"."File" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Folder" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."SharedLink";

-- CreateTable
CREATE TABLE "public"."FolderShare" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileShare" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FolderSharedLink" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permissions" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderSharedLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileSharedLink" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "token" TEXT,
    "permissions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FileSharedLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FolderShare_userId_idx" ON "public"."FolderShare"("userId");

-- CreateIndex
CREATE INDEX "FolderShare_folderId_idx" ON "public"."FolderShare"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "FolderShare_folderId_userId_key" ON "public"."FolderShare"("folderId", "userId");

-- CreateIndex
CREATE INDEX "FileShare_userId_idx" ON "public"."FileShare"("userId");

-- CreateIndex
CREATE INDEX "FileShare_fileId_idx" ON "public"."FileShare"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShare_fileId_userId_key" ON "public"."FileShare"("fileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FolderSharedLink_token_key" ON "public"."FolderSharedLink"("token");

-- CreateIndex
CREATE INDEX "FolderSharedLink_folderId_idx" ON "public"."FolderSharedLink"("folderId");

-- CreateIndex
CREATE INDEX "FolderSharedLink_expiresAt_idx" ON "public"."FolderSharedLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileSharedLink_token_key" ON "public"."FileSharedLink"("token");

-- CreateIndex
CREATE INDEX "FileSharedLink_token_idx" ON "public"."FileSharedLink"("token");

-- CreateIndex
CREATE INDEX "FileSharedLink_fileId_idx" ON "public"."FileSharedLink"("fileId");

-- CreateIndex
CREATE INDEX "FileSharedLink_expiresAt_idx" ON "public"."FileSharedLink"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."FolderShare" ADD CONSTRAINT "FolderShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileShare" ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileSharedLink" ADD CONSTRAINT "FileSharedLink_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
