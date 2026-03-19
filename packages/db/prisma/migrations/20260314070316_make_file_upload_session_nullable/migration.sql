-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_uploadSessionId_fkey";

-- AlterTable
ALTER TABLE "public"."File" ALTER COLUMN "uploadSessionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "public"."UploadSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
