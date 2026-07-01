const { PrismaClient } = require('c:/Users/manis/OneDrive/Desktop/ahealthcare/gobal-backend/apps/web/src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const blogs = await prisma.blog.findMany();
    console.log('Total blogs in DB:', blogs.length);
    blogs.forEach(b => {
      console.log(`- ID: ${b.id}, Project: ${b.projectId}, Slug: ${b.slug}, Title: ${b.title}, Status: ${b.status}`);
    });
  } catch (err) {
    console.error('Error querying blogs:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
