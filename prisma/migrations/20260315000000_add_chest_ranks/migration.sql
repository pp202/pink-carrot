-- AlterTable
ALTER TABLE "Chest"
ADD COLUMN "dashRank" VARCHAR(16),
ADD COLUMN "listRank" VARCHAR(16);

-- Backfill ranks so legacy records keep a stable order until explicit re-ranking is introduced.
UPDATE "Chest"
SET
  "listRank" = LPAD("id"::text, 10, '0'),
  "dashRank" = LPAD("id"::text, 10, '0')
WHERE "listRank" IS NULL
   OR "dashRank" IS NULL;

ALTER TABLE "Chest"
ALTER COLUMN "listRank" SET NOT NULL,
ALTER COLUMN "dashRank" SET NOT NULL;

-- Indexes to speed up ordered queries within a user's chests.
CREATE INDEX "Chest_userId_listRank_idx" ON "Chest"("userId", "listRank");
CREATE INDEX "Chest_userId_dashRank_idx" ON "Chest"("userId", "dashRank");
