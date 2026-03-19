-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('enqueued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'enqueued',
    "progress" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
