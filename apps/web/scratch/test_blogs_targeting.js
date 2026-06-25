const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Get main project ID
    const project = await prisma.project.findFirst({
      where: { apiKey: 'gbl_api_key_main_2024_v2' }
    });
    if (!project) {
      console.error('Project not found!');
      return;
    }
    const projectId = project.id;
    console.log('Using Project ID:', projectId);

    // 2. Clean up any existing test blog
    await prisma.blog.deleteMany({
      where: { slug: 'test-targeted-blog-post' }
    });

    // 3. Create a test blog post targeted to /about-us and /
    const blog = await prisma.blog.create({
      data: {
        projectId,
        title: 'Test Targeted Blog Post',
        slug: 'test-targeted-blog-post',
        content: 'This is a test blog post targeted to specific routes.',
        excerpt: 'Test excerpt',
        category: 'Test',
        status: 'published',
        targetPages: JSON.stringify(['/about-us', '/']),
      }
    });
    console.log('Created test blog post:', blog.title, 'with targetPages:', blog.targetPages);

    // 4. Test querying for "/about-us"
    const targetAboutUs = await prisma.blog.findMany({
      where: {
        projectId,
        status: 'published',
        targetPages: {
          contains: '"/about-us"'
        }
      }
    });
    console.log('Query for "/about-us" returned:', targetAboutUs.length, 'blogs');
    targetAboutUs.forEach(b => console.log(`  - ${b.title} (${b.slug})`));

    // 5. Test querying for "/"
    const targetHome = await prisma.blog.findMany({
      where: {
        projectId,
        status: 'published',
        targetPages: {
          contains: '"/"'
        }
      }
    });
    console.log('Query for "/" returned:', targetHome.length, 'blogs');
    targetHome.forEach(b => console.log(`  - ${b.title} (${b.slug})`));

    // 6. Test querying for "/contact"
    const targetContact = await prisma.blog.findMany({
      where: {
        projectId,
        status: 'published',
        targetPages: {
          contains: '"/contact"'
        }
      }
    });
    console.log('Query for "/contact" returned:', targetContact.length, 'blogs');
    targetContact.forEach(b => console.log(`  - ${b.title} (${b.slug})`));

    // Clean up
    await prisma.blog.delete({ where: { id: blog.id } });
    console.log('Cleaned up test blog post.');

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
