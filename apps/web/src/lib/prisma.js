/**
 * Prisma Client Singleton
 * 
 * Prevents multiple Prisma Client instances in development
 * due to Next.js hot-reloading.
 */


import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
