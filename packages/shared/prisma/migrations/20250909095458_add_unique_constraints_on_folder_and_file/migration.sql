/*
  Warnings:

  - A unique constraint covering the columns `[userId,fullPath]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,fullPath]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_userId_fullPath_key" ON "public"."File"("userId", "fullPath");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_fullPath_key" ON "public"."Folder"("userId", "fullPath");
