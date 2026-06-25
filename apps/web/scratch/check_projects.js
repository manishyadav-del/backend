const { PrismaClient } = require('c:/Users/manis/OneDrive/Desktop/ahealthcare/gobal-backend/apps/web/src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const projects = await prisma.project.findMany();
    console.log('Projects:', projects);
  } catch (err) {
    console.error('Error querying projects:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
