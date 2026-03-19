-- AlterTable
ALTER TABLE "public"."Blob" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."FileChunk" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."UploadSession" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
