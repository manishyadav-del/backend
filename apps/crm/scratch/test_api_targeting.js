const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const project = await prisma.project.findFirst({
      where: { apiKey: 'gbl_api_key_main_2024_v2' }
    });
    if (!project) return;
    const projectId = project.id;

    // Clean up
    await prisma.blog.deleteMany({
      where: { slug: 'test-api-blog' }
    });

    // Create a blog targeted to /about-us via database so we can test the public GET endpoint
    const blog = await prisma.blog.create({
      data: {
        projectId,
        title: 'Test API Targeted Blog',
        slug: 'test-api-blog',
        content: 'Testing targeting filter on public API.',
        status: 'published',
        targetPages: JSON.stringify(['/about-us']),
      }
    });
    console.log('Created blog with ID:', blog.id);

    // Call public API with pagePath=/about-us
    const res1 = await fetch('http://localhost:3000/api/blogs/public?apiKey=gbl_api_key_main_2024_v2&pagePath=/about-us');
    const data1 = await res1.json();
    const blogs1 = data1.blogs || [];
    console.log('API /about-us count:', blogs1.length);
    const found1 = blogs1.find(b => b.slug === 'test-api-blog');
    console.log('Found in /about-us query:', found1 ? 'Yes' : 'No');

    // Call public API with pagePath=/contact
    const res2 = await fetch('http://localhost:3000/api/blogs/public?apiKey=gbl_api_key_main_2024_v2&pagePath=/contact');
    const data2 = await res2.json();
    const blogs2 = data2.blogs || [];
    console.log('API /contact count:', blogs2.length);
    const found2 = blogs2.find(b => b.slug === 'test-api-blog');
    console.log('Found in /contact query:', found2 ? 'Yes' : 'No');

    // Clean up
    await prisma.blog.delete({ where: { id: blog.id } });
    console.log('Cleaned up blog.');

  } catch (err) {
    console.error('API Test Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
