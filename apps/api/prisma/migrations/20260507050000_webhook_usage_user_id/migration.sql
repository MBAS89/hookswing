-- Drop old unique index
DROP INDEX IF EXISTS "webhook_usage_project_id_year_month_key";

-- Rename project_id to user_id
ALTER TABLE "webhook_usage" RENAME COLUMN "project_id" TO "user_id";

-- Create new unique index on user_id + year + month
CREATE UNIQUE INDEX "webhook_usage_user_id_year_month_key" ON "webhook_usage"("user_id", "year", "month");
