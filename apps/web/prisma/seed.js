const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gobal.com' },
    update: {},
    create: {
      id: 'clx1234567890abcdef01',
      email: 'admin@gobal.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      twoFactorEnabled: false,
    },
  });
  console.log(`Created admin user: ${adminUser.email} (password: admin123)`);

  // 2. Create Demo Project
  const project = await prisma.project.upsert({
    where: { id: 'clx1234567890abcdef02' },
    update: {},
    create: {
      id: 'clx1234567890abcdef02',
      name: 'Gobal Main Website',
      domain: 'gobal.com',
      apiKey: 'gbl_api_key_main_2024',
      description: 'Main business website for Gobal - digital solutions provider',
      logo: '/uploads/logo.png',
      favicon: '/uploads/favicon.ico',
      brandColor: '#3b82f6',
      status: 'active',
    },
  });
  console.log(`Created project: ${project.name}`);

  // 3. Create Pages
  const homePage = await prisma.page.upsert({
    where: { id: 'clx1234567890abcdef03' },
    update: {},
    create: {
      id: 'clx1234567890abcdef03',
      projectId: project.id,
      title: 'Home',
      slug: 'home',
      path: '/',
      status: 'published',
      content: '[{"type":"hero","content":"Welcome to Gobal"},{"type":"services","content":"Our Services"}]',
      sections: '[{"type":"hero","title":"Welcome to Gobal"},{"type":"services","title":"What We Offer"}]',
      banner: '/uploads/home-banner.jpg',
      template: 'default',
      sortOrder: 0,
      isHome: true,
      publishedAt: new Date(),
      visibility: 'public',
    },
  });

  const aboutPage = await prisma.page.upsert({
    where: { id: 'clx1234567890abcdef04' },
    update: {},
    create: {
      id: 'clx1234567890abcdef04',
      projectId: project.id,
      title: 'About Us',
      slug: 'about',
      path: '/about',
      status: 'published',
      content: '[{"type":"about","content":"About Gobal Company"}]',
      banner: '/uploads/about-banner.jpg',
      sortOrder: 1,
      isHome: false,
      publishedAt: new Date(),
      visibility: 'public',
    },
  });
  console.log(`Created ${homePage.isHome ? 'home' : ''} page: ${homePage.title} and ${aboutPage.title}`);

  // 4. Create SEO
  await prisma.sEO.upsert({
    where: { id: 'clx1234567890abcdef05' },
    update: {},
    create: {
      id: 'clx1234567890abcdef05',
      pageId: homePage.id,
      metaTitle: 'Gobal - Digital Solutions for Your Business',
      metaDescription: 'Gobal provides cutting-edge digital solutions including web development, SEO, and marketing services.',
      urlSlug: 'home',
      canonical: 'https://gobal.com',
      ogImage: '/uploads/og-home.jpg',
      robots: 'index, follow',
    },
  });

  await prisma.sEO.upsert({
    where: { id: 'clx1234567890abcdef06' },
    update: {},
    create: {
      id: 'clx1234567890abcdef06',
      pageId: aboutPage.id,
      metaTitle: 'About Gobal - Our Story & Team',
      metaDescription: 'Learn about Gobal, our mission, vision, and the team behind our digital solutions.',
      urlSlug: 'about',
      canonical: 'https://gobal.com/about',
      robots: 'index, follow',
    },
  });

  // 5. Create Services
  const services = [
    { id: 'clx1234567890abcdef07', title: 'Web Development', description: 'Custom web applications built with modern technologies like React, Next.js, and Node.js.', ctaText: 'Learn More', ctaLink: '/services/web-development', sortOrder: 1 },
    { id: 'clx1234567890abcdef08', title: 'SEO Optimization', description: 'Improve your search engine rankings with our comprehensive SEO strategies.', ctaText: 'Get Started', ctaLink: '/services/seo', sortOrder: 2 },
    { id: 'clx1234567890abcdef09', title: 'Digital Marketing', description: 'Full-funnel digital marketing campaigns that drive results and grow your business.', ctaText: 'Explore', ctaLink: '/services/digital-marketing', sortOrder: 3 },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: {
        id: svc.id,
        projectId: project.id,
        title: svc.title,
        description: svc.description,
        image: `/uploads/services/${svc.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        ctaText: svc.ctaText,
        ctaLink: svc.ctaLink,
        sortOrder: svc.sortOrder,
        isVisible: true,
      },
    });
  }
  console.log('Created 3 services');

  // 6. Create Testimonials
  const testimonials = [
    { id: 'clx1234567890abcdef12', clientName: 'Rahul Sharma', rating: 5, content: 'Gobal transformed our online presence. Our traffic increased by 300% in just 3 months!', sortOrder: 1 },
    { id: 'clx1234567890abcdef13', clientName: 'Priya Patel', rating: 5, content: 'The team at Gobal is incredibly professional. They delivered our website ahead of schedule.', sortOrder: 2 },
    { id: 'clx1234567890abcdef14', clientName: 'Amit Verma', rating: 4, content: 'Excellent SEO services. We are now ranking #1 for our target keywords.', sortOrder: 3 },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        projectId: project.id,
        clientName: t.clientName,
        clientImage: `/uploads/testimonials/${t.clientName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        rating: t.rating,
        content: t.content,
        isVisible: true,
        sortOrder: t.sortOrder,
      },
    });
  }
  console.log('Created 3 testimonials');

  // 7. Create Contacts
  const contacts = [
    { id: 'clx1234567890abcdef22', type: 'email', label: 'Email', value: 'contact@gobal.com', icon: 'fas fa-envelope', sortOrder: 1 },
    { id: 'clx1234567890abcdef23', type: 'phone', label: 'Phone', value: '+91-98765-43210', icon: 'fas fa-phone', sortOrder: 2 },
    { id: 'clx1234567890abcdef24', type: 'address', label: 'Office Address', value: '123, Tech Park, Sector 62, Noida, Uttar Pradesh - 201301', icon: 'fas fa-map-marker-alt', sortOrder: 3 },
    { id: 'clx1234567890abcdef25', type: 'hours', label: 'Business Hours', value: 'Mon - Fri: 9:00 AM - 6:00 PM', icon: 'fas fa-clock', sortOrder: 4 },
  ];

  for (const c of contacts) {
    await prisma.contact.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        projectId: project.id,
        type: c.type,
        label: c.label,
        value: c.value,
        icon: c.icon,
        sortOrder: c.sortOrder,
      },
    });
  }
  console.log('Created 4 contacts');

  // 8. Create Navigation
  await prisma.navigation.upsert({
    where: { id: 'clx1234567890abcdef26' },
    update: {},
    create: {
      id: 'clx1234567890abcdef26',
      projectId: project.id,
      location: 'main',
      items: JSON.stringify([
        { label: 'Home', path: '/' },
        { label: 'About', path: '/about' },
        {
          label: 'Services', path: '/services', children: [
            { label: 'Web Development', path: '/services/web-development' },
            { label: 'SEO', path: '/services/seo' },
            { label: 'Digital Marketing', path: '/services/digital-marketing' },
          ],
        },
        { label: 'Blog', path: '/blog' },
        { label: 'Contact', path: '/contact' },
      ]),
    },
  });

  // 9. Create Legal Pages
  await prisma.legalPage.upsert({
    where: { id: 'clx1234567890abcdef27' },
    update: {},
    create: {
      id: 'clx1234567890abcdef27',
      projectId: project.id,
      type: 'privacy',
      title: 'Privacy Policy',
      content: 'Full privacy policy content...',
    },
  });

  await prisma.legalPage.upsert({
    where: { id: 'clx1234567890abcdef28' },
    update: {},
    create: {
      id: 'clx1234567890abcdef28',
      projectId: project.id,
      type: 'terms',
      title: 'Terms & Conditions',
      content: 'Full terms and conditions content...',
    },
  });

  // 10. Create Global Settings
  await prisma.globalSetting.upsert({
    where: { id: 'clx1234567890abcdef32' },
    update: {},
    create: {
      id: 'clx1234567890abcdef32',
      projectId: project.id,
      logo: '/uploads/logo.png',
      favicon: '/uploads/favicon.ico',
      brandColor: '#3b82f6',
      headerSettings: JSON.stringify({ sticky: true, showCTA: true, ctaText: 'Get Started' }),
      footerSettings: JSON.stringify({ showNewsletter: true, columns: 3 }),
      maintenanceMode: false,
      defaultContact: JSON.stringify({ email: 'contact@gobal.com', phone: '+91-98765-43210' }),
      analytics: JSON.stringify({ gaId: 'G-XXXXXXXXXX', clarityId: 'abc123def' }),
      cookieConsent: true,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Login credentials:');
  console.log('  Email: admin@gobal.com');
  console.log('  Password: admin123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });