-- Drop the existing foreign key constraint (CASCADE)
ALTER TABLE "webhooks" DROP CONSTRAINT "webhooks_project_id_fkey";

-- Make project_id nullable
ALTER TABLE "webhooks" ALTER COLUMN "project_id" DROP NOT NULL;

-- Recreate foreign key with SET NULL on delete
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_project_id_fkey" 
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
