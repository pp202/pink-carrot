-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NEW', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(250) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chest" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Chest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrot" (
    "id" BIGSERIAL NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "chestId" INTEGER NOT NULL,

    CONSTRAINT "Carrot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chest" ADD CONSTRAINT "Chest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrot" ADD CONSTRAINT "Carrot_chestId_fkey" FOREIGN KEY ("chestId") REFERENCES "Chest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
