const { PrismaClient } = require('./apps/web/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, apiKey: true }
  });
  console.log('Projects:', projects);
  const redirects = await prisma.redirect.findMany();
  console.log('Redirects:', redirects);
  const navigation = await prisma.navigation.findMany();
  console.log('Navigation:', navigation);
}

main().catch(console.error).finally(() => prisma.$disconnect());
