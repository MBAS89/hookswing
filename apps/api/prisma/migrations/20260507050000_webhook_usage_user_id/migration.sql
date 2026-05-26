-- This migration fixes legacy databases that had project_id instead of user_id.
-- On fresh databases, the table already has user_id (created by previous migration).

-- Drop old unique index if it exists (legacy only)
DROP INDEX IF EXISTS "webhook_usage_project_id_year_month_key";

-- Rename project_id to user_id ONLY if project_id exists (legacy only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'webhook_usage' AND column_name = 'project_id') THEN
        ALTER TABLE "webhook_usage" RENAME COLUMN "project_id" TO "user_id";
    END IF;
END $$;

-- Create the correct unique index if it doesn't already exist
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_usage_user_id_year_month_key" ON "webhook_usage"("user_id", "year", "month");
