-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "storageQuota" BIGINT NOT NULL DEFAULT 524288000,
ADD COLUMN     "storageUsed" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."SystemStats" (
    "id" TEXT NOT NULL,
    "totalStorageUsed" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "SystemStats_pkey" PRIMARY KEY ("id")
);
