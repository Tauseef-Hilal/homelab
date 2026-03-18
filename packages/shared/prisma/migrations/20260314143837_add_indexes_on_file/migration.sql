-- DropIndex
DROP INDEX "public"."File_folderId_idx";

-- CreateIndex
CREATE INDEX "File_userId_folderId_idx" ON "public"."File"("userId", "folderId");
