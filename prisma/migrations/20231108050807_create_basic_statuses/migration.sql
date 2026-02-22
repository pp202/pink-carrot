/*
  Warnings:

  - The values [OPEN,CLOSED] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('NEW', 'ARCHIVED');
ALTER TABLE "List" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "List" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "List" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "List" ALTER COLUMN "status" SET DEFAULT 'NEW';
