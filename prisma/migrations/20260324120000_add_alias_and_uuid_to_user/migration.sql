-- Ensure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add columns as nullable first so we can backfill existing UUIDs safely
ALTER TABLE "User"
ADD COLUMN "alias" VARCHAR(255),
ADD COLUMN "uuid" UUID;

-- Backfill existing UUIDs only
UPDATE "User"
SET
  "uuid" = gen_random_uuid()
WHERE "uuid" IS NULL;

-- Enforce constraints for new and existing data
ALTER TABLE "User"
ALTER COLUMN "uuid" SET NOT NULL,
ALTER COLUMN "uuid" SET DEFAULT gen_random_uuid();

-- Ensure UUID remains unique
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");
