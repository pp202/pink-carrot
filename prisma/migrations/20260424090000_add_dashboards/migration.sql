CREATE TABLE "Dashboard" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "dashRank" VARCHAR(16) NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Dashboard_userId_dashRank_idx" ON "Dashboard"("userId", "dashRank");

ALTER TABLE "ChestPad" ADD COLUMN "dashboardId" INTEGER;

INSERT INTO "Dashboard" ("name", "dashRank", "userId")
SELECT 'Dashboard', '1000000000', "id"
FROM "User";

UPDATE "ChestPad" cp
SET "dashboardId" = d."id"
FROM "Dashboard" d
WHERE d."userId" = cp."userId"
  AND d."name" = 'Dashboard'
  AND cp."dashboardId" IS NULL;

ALTER TABLE "ChestPad" ALTER COLUMN "dashboardId" SET NOT NULL;

CREATE INDEX "ChestPad_dashboardId_idx" ON "ChestPad"("dashboardId");

ALTER TABLE "Dashboard"
ADD CONSTRAINT "Dashboard_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChestPad"
ADD CONSTRAINT "ChestPad_dashboardId_fkey"
FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
