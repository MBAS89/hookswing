-- Add parent_id column to webhook_comments for reply threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE "webhook_comments" ADD COLUMN "parent_id" TEXT;
    CREATE INDEX "webhook_comments_parent_id_idx" ON "webhook_comments"("parent_id");
  END IF;
END $$;

-- Add foreign key for parent_id (self-referencing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'webhook_comments_parent_id_fkey'
  ) THEN
    ALTER TABLE "webhook_comments"
      ADD CONSTRAINT "webhook_comments_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "webhook_comments"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Create comment_reactions table for likes/dislikes
CREATE TABLE IF NOT EXISTS "comment_reactions" (
  "id" TEXT NOT NULL,
  "comment_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint to prevent duplicate reactions per user per comment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comment_reactions_comment_id_user_id_key'
  ) THEN
    ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");
  END IF;
END $$;

-- Add foreign keys to comment_reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comment_reactions_comment_id_fkey'
  ) THEN
    ALTER TABLE "comment_reactions"
      ADD CONSTRAINT "comment_reactions_comment_id_fkey"
      FOREIGN KEY ("comment_id") REFERENCES "webhook_comments"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comment_reactions_user_id_fkey'
  ) THEN
    ALTER TABLE "comment_reactions"
      ADD CONSTRAINT "comment_reactions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
