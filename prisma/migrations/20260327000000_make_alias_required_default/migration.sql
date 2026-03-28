UPDATE "User"
SET "alias" = 'Chest wizard'
WHERE "alias" IS NULL OR BTRIM("alias") = '';

ALTER TABLE "User"
ALTER COLUMN "alias" SET DEFAULT 'Chest wizard',
ALTER COLUMN "alias" SET NOT NULL;
