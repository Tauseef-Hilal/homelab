/*
  Warnings:

  - You are about to drop the column `fileId` on the `UploadSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UploadSession" DROP COLUMN "fileId";
