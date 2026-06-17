/**
 * Prisma Client Singleton
 * 
 * Prevents multiple Prisma Client instances in development
 * due to Next.js hot-reloading.
 */


import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}