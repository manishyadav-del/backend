const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const pages = await prisma.page.findMany({
      include: {
        project: true
      }
    });
    console.log('Total pages found:', pages.length);
    pages.forEach(p => {
      console.log(`Page: ${p.title} (${p.slug}) - Project: ${p.project?.name} (${p.projectId}) - Status: ${p.status}`);
    });
  } catch (err) {
    console.error('Error querying pages:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
