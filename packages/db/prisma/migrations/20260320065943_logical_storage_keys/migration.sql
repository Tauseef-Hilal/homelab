-- 1. Rename the column safely without dropping data
ALTER TABLE "Blob" RENAME COLUMN "storageKey" TO "blobKey";

-- 2. Strip the absolute path prefix from existing blobs.
-- Assuming your old paths looked like: /app/data/blobs/a1/b2/a1b2...
-- We want to keep everything from 'blobs/' onwards.
-- NOTE: Adjust '/app/data/' to match whatever your actual ROOT_DIR was!
UPDATE "Blob" 
SET "blobKey" = SUBSTRING("blobKey" FROM POSITION('blobs/' IN "blobKey"));

-- 3. Handle DownloadLink (Rename and set a default displayName)
ALTER TABLE "DownloadLink" RENAME COLUMN "fileName" TO "artifactKey";
ALTER TABLE "DownloadLink" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT 'download.zip';

-- 4. Strip absolute paths from DownloadLink (if they were stored as absolute)
-- Assuming they were stored as /app/data/downloads/xyz.zip
UPDATE "DownloadLink"
SET "artifactKey" = SUBSTRING("artifactKey" FROM POSITION('downloads/' IN "artifactKey"));