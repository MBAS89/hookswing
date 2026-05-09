-- Create Provider enum
CREATE TYPE "Provider" AS ENUM ('STRIPE', 'GITHUB', 'PAYPAL', 'TWILIO', 'SHOPIFY', 'DISCORD', 'SLACK', 'CUSTOM');

-- Create ScanStatus enum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- Create security_scans table
CREATE TABLE IF NOT EXISTS "security_scans" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "project_id" TEXT,
  "target_url" TEXT NOT NULL,
  "provider" "Provider" NOT NULL DEFAULT 'STRIPE',
  "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
  "results" JSONB NOT NULL,
  "security_score" INTEGER,
  "is_vulnerable" BOOLEAN NOT NULL DEFAULT false,
  "detected_framework" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "security_scans_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to users
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add index for scan queries
CREATE INDEX "security_scans_user_id_created_at_idx" ON "security_scans"("user_id", "created_at");
