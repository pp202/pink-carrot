CREATE TABLE "ConnectionRequest" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConnectionRequest_createdAt_idx" ON "ConnectionRequest"("createdAt");

ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
