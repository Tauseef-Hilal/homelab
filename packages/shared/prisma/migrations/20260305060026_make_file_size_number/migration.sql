/*
  Warnings:

  - You are about to alter the column `size` on the `File` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `totalStorageUsed` on the `SystemStats` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `storageQuota` on the `User` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `storageUsed` on the `User` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."File" ALTER COLUMN "size" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."SystemStats" ALTER COLUMN "totalStorageUsed" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "storageQuota" SET DATA TYPE INTEGER,
ALTER COLUMN "storageUsed" SET DATA TYPE INTEGER;
