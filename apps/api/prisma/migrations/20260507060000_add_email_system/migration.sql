-- AlterTable: add email verification and password reset fields to users
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "email_verification_token" TEXT;
ALTER TABLE "users" ADD COLUMN "email_verification_expires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "password_reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN "password_reset_expires" TIMESTAMP(3);

-- CreateTable: email_logs
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_user_id_created_at_idx" ON "email_logs"("user_id", "created_at");
CREATE INDEX "email_logs_type_created_at_idx" ON "email_logs"("type", "created_at");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
