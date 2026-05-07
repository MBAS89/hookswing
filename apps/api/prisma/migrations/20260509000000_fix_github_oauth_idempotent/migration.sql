-- Idempotently add github_id if the previous migration failed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'github_id'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "github_id" TEXT;
    END IF;
END $$;

-- Idempotently create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "users_github_id_key" ON "users"("github_id");
