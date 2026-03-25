-- CreateTable
CREATE TABLE "ChestPad" (
    "id" BIGSERIAL NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'NEW',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "listRank" VARCHAR(16) NOT NULL,
    "dashRank" VARCHAR(16) NOT NULL,
    "userId" INTEGER NOT NULL,
    "chestId" INTEGER NOT NULL,

    CONSTRAINT "ChestPad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- Backfill chest ownership and list metadata from Chest into ChestPad
INSERT INTO "ChestPad" ("status", "pinned", "listRank", "dashRank", "userId", "chestId")
SELECT "status", "pinned", "listRank", "dashRank", "userId", "id"
FROM "Chest";

-- CreateIndex
CREATE INDEX "ChestPad_userId_listRank_idx" ON "ChestPad"("userId", "listRank");

-- CreateIndex
CREATE INDEX "ChestPad_userId_dashRank_idx" ON "ChestPad"("userId", "dashRank");

-- CreateIndex
CREATE INDEX "ChestPad_chestId_idx" ON "ChestPad"("chestId");

-- AddForeignKey
ALTER TABLE "ChestPad" ADD CONSTRAINT "ChestPad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChestPad" ADD CONSTRAINT "ChestPad_chestId_fkey" FOREIGN KEY ("chestId") REFERENCES "Chest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove moved columns from Chest
ALTER TABLE "Chest"
DROP COLUMN "status",
DROP COLUMN "pinned",
DROP COLUMN "listRank",
DROP COLUMN "dashRank",
DROP COLUMN "userId";

-- Drop obsolete indexes from Chest
DROP INDEX IF EXISTS "Chest_userId_listRank_idx";
DROP INDEX IF EXISTS "Chest_userId_dashRank_idx";
