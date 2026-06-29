const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'clx1234567890abcdef02';

  // Privacy Policy HTML
  const privacyHtml = `
    <h2>Introduction</h2>
    <p>At ahealthplace, we prioritize the privacy of our users, contributors, and partners. This Privacy Policy outlines the types of personal information we collect, how we use it, and the measures we take to protect it.</p>
    
    <h2>Managed by DIFM LLC</h2>
    <p>Please note that ahealthplace’s operations within the country are under the management of DIFM LLC. This management relationship means that DIFM LLC oversees the data handling, processing, and storage for ahealthplace in compliance with all applicable laws and regulations.</p>
    
    <h2>Information We Collect</h2>
    <p>When you interact with our platforms, we may collect:</p>
    <ul>
      <li>Personal details like name, email address, phone number, etc.</li>
      <li>Portfolio submissions, photographs, or any form of content you submit.</li>
      <li>Usage data like IP address, browser type, and other standard web log information.</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <p>Your data is used for:</p>
    <ul>
      <li>Publishing and promoting the content you submit.</li>
      <li>Responding to inquiries or feedback.</li>
      <li>Sending updates, newsletters, or marketing communications (only if you’ve opted in).</li>
    </ul>
  `;

  // Terms and Conditions HTML
  const termsHtml = `
    <h2>Introduction</h2>
    <p>Welcome to ahealthplace. By accessing and using our website and services, you agree to comply with and be bound by the following terms and conditions.</p>
    
    <h2>Acceptance of Terms</h2>
    <p>By using our website and services, you confirm your acceptance of these terms. If you do not agree to these terms, please do not use our services.</p>
    
    <h2>Changes to the Terms</h2>
    <p>ahealthplace reserves the right to modify these Terms of Use at any time. It is your responsibility to periodically review these terms to stay informed.</p>
    
    <h2>Use of Content</h2>
    <p>All content on this website, including text, images, graphics, and logos, is the property of ahealthplace and is protected by copyright laws. You may use the content for personal, non-commercial purposes. Any other use, including reproduction, modification, or distribution, is prohibited without our written consent.</p>
  `;

  // Seed Privacy Policy
  const existingPrivacy = await prisma.legalPage.findFirst({
    where: { projectId, type: 'privacy' }
  });
  if (existingPrivacy) {
    await prisma.legalPage.update({
      where: { id: existingPrivacy.id },
      data: { title: 'Privacy Policy', content: privacyHtml }
    });
    console.log('Updated existing Privacy Policy');
  } else {
    await prisma.legalPage.create({
      data: {
        projectId,
        type: 'privacy',
        title: 'Privacy Policy',
        content: privacyHtml
      }
    });
    console.log('Created Privacy Policy');
  }

  // Seed Terms and Conditions
  const existingTerms = await prisma.legalPage.findFirst({
    where: { projectId, type: 'terms' }
  });
  if (existingTerms) {
    await prisma.legalPage.update({
      where: { id: existingTerms.id },
      data: { title: 'Terms and Conditions', content: termsHtml }
    });
    console.log('Updated existing Terms and Conditions');
  } else {
    await prisma.legalPage.create({
      data: {
        projectId,
        type: 'terms',
        title: 'Terms and Conditions',
        content: termsHtml
      }
    });
    console.log('Created Terms and Conditions');
  }

  console.log('Successfully completed legal pages seed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
