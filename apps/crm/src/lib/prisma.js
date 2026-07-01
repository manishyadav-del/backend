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

// Background scheduler to automatically publish scheduled blogs every 30 seconds
if (!globalForPrisma.scheduledBlogsInterval) {
  globalForPrisma.scheduledBlogsInterval = setInterval(async () => {
    try {
      const matured = await prisma.blog.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: new Date() }
        }
      });

      if (matured.length > 0) {
        console.log(`[Auto-Publisher] Found ${matured.length} matured scheduled posts. Publishing...`);
        for (const blog of matured) {
          await prisma.blog.update({
            where: { id: blog.id },
            data: {
              status: 'published',
              publishedAt: new Date()
            }
          });
          console.log(`[Auto-Publisher] Automatically published: "${blog.title}"`);
        }
      }
    } catch (err) {
      // Fail silently in background
    }
  }, 30000);
}

export { prisma };
export default prisma;
