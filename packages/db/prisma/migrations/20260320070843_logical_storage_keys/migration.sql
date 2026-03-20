/*
  Warnings:

  - A unique constraint covering the columns `[blobKey]` on the table `Blob` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."DownloadLink" ALTER COLUMN "displayName" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Blob_blobKey_key" ON "public"."Blob"("blobKey");
