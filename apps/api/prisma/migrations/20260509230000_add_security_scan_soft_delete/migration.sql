-- Add soft-delete support to security_scans
ALTER TABLE "security_scans" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
