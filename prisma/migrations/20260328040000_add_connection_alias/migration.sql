ALTER TABLE "Connection" ADD COLUMN "alias" VARCHAR(255);

UPDATE "Connection" c
SET "alias" = u."alias"
FROM "User" u
WHERE c."connectionUserId" = u."id";

UPDATE "Connection"
SET "alias" = 'Chest wizard'
WHERE "alias" IS NULL OR BTRIM("alias") = '';

ALTER TABLE "Connection"
  ALTER COLUMN "alias" SET NOT NULL;
