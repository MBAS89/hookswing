-- AlterTable
ALTER TABLE "projects" ADD COLUMN "custom_slug" TEXT;
CREATE UNIQUE INDEX "projects_custom_slug_key" ON "projects"("custom_slug");
