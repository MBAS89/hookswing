-- Create feedback table
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to users
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add index for admin queries
CREATE INDEX "feedback_status_created_at_idx" ON "feedback"("status", "created_at");
