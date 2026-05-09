-- Create admin_alert_configs table
CREATE TABLE IF NOT EXISTS "admin_alert_configs" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "config" JSONB,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "events" TEXT[] NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "admin_alert_configs_pkey" PRIMARY KEY ("id")
);
