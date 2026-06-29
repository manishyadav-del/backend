const { PrismaClient } = require('./apps/web/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  // Simulating Admin moderation in the backend database
  const pending = await prisma.fAQ.findFirst({
    where: { question: 'What treatments do you offer for cardiac issues?' }
  });

  if (pending) {
    console.log('Found pending FAQ:', pending.id);
    const updated = await prisma.fAQ.update({
      where: { id: pending.id },
      data: {
        answer: 'We offer comprehensive diagnostics, consultations, medication management, and leading surgical referrals.',
        isVisible: true
      }
    });
    console.log('Updated FAQ (moderated):', updated);

    // Verify it is now in active GET list
    const res = await fetch('http://localhost:3000/api/faqs/public?apiKey=gbl_api_key_main_2024_v2');
    const data = await res.json();
    console.log('GET Active FAQs length now:', data.faqs?.length);
    console.log('GET Active FAQs:', data.faqs);
  } else {
    console.error('Pending FAQ not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
