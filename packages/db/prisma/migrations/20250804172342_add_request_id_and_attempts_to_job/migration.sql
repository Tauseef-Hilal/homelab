/*
  Warnings:

  - Added the required column `requestId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requestId" TEXT NOT NULL,
ALTER COLUMN "progress" SET DEFAULT 0;
