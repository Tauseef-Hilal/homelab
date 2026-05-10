/*
  Warnings:

  - Made the column `token` on table `FileSharedLink` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `FolderShare` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."BroadcastMessage" DROP CONSTRAINT "BroadcastMessage_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DownloadLink" DROP CONSTRAINT "DownloadLink_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UploadSession" DROP CONSTRAINT "UploadSession_userId_fkey";

-- DropIndex
DROP INDEX "public"."FileChunk_fileId_idx";

-- DropIndex
DROP INDEX "public"."FileShare_fileId_idx";

-- DropIndex
DROP INDEX "public"."Folder_userId_fullPath_idx";

-- DropIndex
DROP INDEX "public"."FolderShare_folderId_idx";

-- AlterTable
ALTER TABLE "public"."FileShare" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."FileSharedLink" ALTER COLUMN "token" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."FolderShare" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UploadSession" ADD CONSTRAINT "UploadSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderSharedLink" ADD CONSTRAINT "FolderSharedLink_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DownloadLink" ADD CONSTRAINT "DownloadLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
