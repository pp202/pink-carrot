import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const connectionString = process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("POSTGRES_PRISMA_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

const createPrismaClient = () =>
    new PrismaClient({
      adapter,
    });

// Prevent exhausting connections in dev due to HMR
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;