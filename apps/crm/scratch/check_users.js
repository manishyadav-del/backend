const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.findMany({});
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`User: ${u.email} - Role: ${u.role} - Status: ${u.status}`);
    });
  } catch (err) {
    console.error('Error querying users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
