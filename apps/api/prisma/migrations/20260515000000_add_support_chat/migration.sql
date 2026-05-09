-- Create support_chats table
CREATE TABLE IF NOT EXISTS "support_chats" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "is_admin" BOOLEAN NOT NULL DEFAULT false,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "support_chats_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to users
ALTER TABLE "support_chats" ADD CONSTRAINT "support_chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add index for chat queries
CREATE INDEX "support_chats_user_id_created_at_idx" ON "support_chats"("user_id", "created_at");
