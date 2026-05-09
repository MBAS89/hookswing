-- AlterTable
ALTER TABLE "webhooks" ADD COLUMN IF NOT EXISTS "event_type" TEXT;
