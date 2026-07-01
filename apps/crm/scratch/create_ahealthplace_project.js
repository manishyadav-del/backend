import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'ahealthplace_website_id_123';
  
  // Check if project exists
  const existing = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (existing) {
    console.log('Project "ahealthplace_website_id_123" already exists in DB!');
    return;
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      id: projectId,
      name: 'AHealthPlace Website',
      domain: 'localhost:3001',
      apiKey: 'gbl_api_key_ahealthplace_2026', // unique API key
      description: 'The AHealthPlace frontend website integration',
      brandColor: '#4ccbc4',
      status: 'active',
    }
  });

  console.log('Created Project:', JSON.stringify(project, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
