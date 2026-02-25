-- CreateTable
CREATE TABLE "Carrot" (
    "id" BIGSERIAL NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "listId" INTEGER NOT NULL,

    CONSTRAINT "Carrot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Carrot" ADD CONSTRAINT "Carrot_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
