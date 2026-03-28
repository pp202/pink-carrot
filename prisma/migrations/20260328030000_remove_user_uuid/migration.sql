-- User.uuid is no longer used for chestpal relationships.
DROP INDEX IF EXISTS "User_uuid_key";
DROP INDEX IF EXISTS "User_uuid_idx";

ALTER TABLE "User" DROP COLUMN IF EXISTS "uuid";
