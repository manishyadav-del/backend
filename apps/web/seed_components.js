const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const websiteId = 'ahealthplace_website_id_123';

  // Clear existing components for this website to prevent duplicate conflicts
  await prisma.websiteComponent.deleteMany({
    where: { websiteId }
  });

  const components = [
    {
      websiteId,
      name: 'BlogHeroSection',
      filePath: 'src/components/Hero.tsx',
      route: '/',
      componentType: 'Section',
      props: JSON.stringify(['title']),
      data: JSON.stringify({
        title: 'Featured Posts'
      }),
      status: 'active',
      sortOrder: 1
    },
    {
      websiteId,
      name: 'CookieConsent',
      filePath: 'src/components/CookieConsent.tsx',
      route: '*',
      componentType: 'Widget',
      props: JSON.stringify(['message', 'buttonText']),
      data: JSON.stringify({
        message: 'This website uses cookies to improve experience.',
        buttonText: 'Accept Cookies'
      }),
      status: 'active',
      sortOrder: 2
    },
    {
      websiteId,
      name: 'Header',
      filePath: 'src/common/header.tsx',
      route: '*',
      componentType: 'Layout',
      props: JSON.stringify(['logo']),
      data: JSON.stringify({
        logo: '/Logo-Main.png'
      }),
      status: 'active',
      sortOrder: 3
    },
    {
      websiteId,
      name: 'Footer',
      filePath: 'src/common/footer.tsx',
      route: '*',
      componentType: 'Layout',
      props: JSON.stringify(['contactEmail', 'copyright', 'description']),
      data: JSON.stringify({
        contactEmail: 'info@ahealthplace.com',
        copyright: '© 2026 A HEALTH PLACE. All Rights Reserved.',
        description: 'A Health Place is a free to use service for all your health information needs.'
      }),
      status: 'active',
      sortOrder: 4
    }
  ];

  for (const comp of components) {
    await prisma.websiteComponent.create({
      data: comp
    });
  }

  console.log('Successfully registered all website components under ahealthplace_website_id_123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
