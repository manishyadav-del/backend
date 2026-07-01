const { PrismaClient } = require('c:/Users/manis/OneDrive/Desktop/ahealthcare/gobal-backend/apps/web/src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const websiteId = 'ahealthplace_website_id_123';
    
    // Resolve project ID
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website) {
      console.log('Website not found!');
      return;
    }
    
    const project = await prisma.project.findUnique({ where: { apiKey: website.apiKey } });
    if (!project) {
      console.log('Project not found for apiKey:', website.apiKey);
      return;
    }
    
    console.log('Resolved Project ID:', project.id);
    
    const headerConfig = {
      logo: '/Logo-web.png',
      sticky: true,
      style: 'modern',
      navLinks: [
        { label: 'HOME', href: '/' },
        { label: 'PUBLICATIONS', href: '/publication' },
        { label: 'ABOUT US', href: '/about-us' },
        { label: 'CONTACT', href: '/contact' }
      ],
      ctaText: 'Book Appointment',
      ctaLink: '/contact',
      transparent: false,
      announcementBarActive: true,
      announcementBarText: '🎉 Live announcement from backend!'
    };
    
    const settings = await prisma.globalSetting.upsert({
      where: { projectId: project.id },
      update: { headerSettings: JSON.stringify(headerConfig) },
      create: { projectId: project.id, headerSettings: JSON.stringify(headerConfig) },
    });
    
    console.log('Updated Settings Row:', settings);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
