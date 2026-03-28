-- Restore UUID uniqueness because linking is now modeled by Connection rows.
UPDATE "User" u
SET "uuid" = gen_random_uuid()
FROM (
  SELECT "id"
  FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "uuid" ORDER BY "id") AS row_num
    FROM "User"
  ) ranked
  WHERE ranked.row_num > 1
) duplicates
WHERE u."id" = duplicates."id";

DROP INDEX IF EXISTS "User_uuid_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "User_uuid_key" ON "User"("uuid");

-- Replace UUID-grouping behavior with explicit user-to-user connections.
DELETE FROM "Connection";
ALTER TABLE "Connection" ADD COLUMN "connectionUserId" INTEGER;

UPDATE "Connection"
SET "connectionUserId" = "userId"
WHERE "connectionUserId" IS NULL;

ALTER TABLE "Connection"
  ALTER COLUMN "connectionUserId" SET NOT NULL;

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_connectionUserId_fkey"
  FOREIGN KEY ("connectionUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Connection_userId_connectionUserId_key" ON "Connection"("userId", "connectionUserId");
CREATE INDEX "Connection_connectionUserId_idx" ON "Connection"("connectionUserId");
