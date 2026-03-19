/*
  Warnings:

  - A unique constraint covering the columns `[uploadSessionId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[folderId,name,userId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parentId,name,userId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uploadSessionId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('active', 'cancelled', 'completed', 'expired');

-- AlterTable
ALTER TABLE "public"."File" ADD COLUMN     "uploadSessionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."FileChunk" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "blobId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blob" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "refCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UploadSession" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "uploadedChunks" INTEGER NOT NULL,
    "totalSize" INTEGER NOT NULL,
    "status" "public"."UploadStatus" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileChunk_fileId_chunkIndex_key" ON "public"."FileChunk"("fileId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Blob_hash_key" ON "public"."Blob"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "File_uploadSessionId_key" ON "public"."File"("uploadSessionId");

-- CreateIndex
CREATE INDEX "File_folderId_idx" ON "public"."File"("folderId");

-- CreateIndex
CREATE INDEX "File_fullPath_idx" ON "public"."File"("fullPath");

-- CreateIndex
CREATE UNIQUE INDEX "File_folderId_name_userId_key" ON "public"."File"("folderId", "name", "userId");

-- CreateIndex
CREATE INDEX "Folder_fullPath_idx" ON "public"."Folder"("fullPath");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_parentId_name_userId_key" ON "public"."Folder"("parentId", "name", "userId");

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "public"."UploadSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileChunk" ADD CONSTRAINT "FileChunk_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileChunk" ADD CONSTRAINT "FileChunk_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "public"."Blob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
