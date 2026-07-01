const { PrismaClient } = require('c:/Users/manis/OneDrive/Desktop/ahealthcare/gobal-backend/apps/web/src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const pages = await prisma.page.findMany();
    console.log('Total pages in DB:', pages.length);
    pages.forEach(p => {
      console.log(`- ID: ${p.id}, Project: ${p.projectId}, Slug: ${p.slug}, Title: ${p.title}, Status: ${p.status}`);
    });
  } catch (err) {
    console.error('Error querying pages:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
