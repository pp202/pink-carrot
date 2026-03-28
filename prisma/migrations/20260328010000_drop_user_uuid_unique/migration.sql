-- Allow users to share the same UUID for chestpal grouping.
DROP INDEX IF EXISTS "User_uuid_key";

-- Keep lookups by uuid performant.
CREATE INDEX IF NOT EXISTS "User_uuid_idx" ON "User"("uuid");
