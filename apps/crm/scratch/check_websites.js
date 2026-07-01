const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const websites = await prisma.connectedWebsite.findMany({});
    console.log('Websites found:', websites.length);
    websites.forEach(w => {
      console.log(`Website: ${w.name} (${w.id}) - Domain: ${w.domain} - Status: ${w.status}`);
    });
  } catch (err) {
    console.error('Error querying websites:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
