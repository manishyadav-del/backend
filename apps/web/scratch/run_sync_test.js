const { mediaService } = require('../src/lib/services/mediaService.js');
const { PrismaClient } = require('c:/Users/manis/OneDrive/Desktop/ahealthcare/gobal-backend/apps/web/src/generated/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const projectId = 'ahealthplace_website_id_123';
    
    // Check current media records in DB
    const beforeCount = await prisma.media.count({ where: { projectId: 'clx1234567890abcdef02' } });
    console.log('Media count before sync:', beforeCount);
    
    // Run sync
    console.log('Running sync...');
    const result = await mediaService.syncFrontendMedia(projectId);
    console.log('Sync Result:', result);
    
    // Check media records in DB after sync
    const afterCount = await prisma.media.count({ where: { projectId: 'clx1234567890abcdef02' } });
    console.log('Media count after sync:', afterCount);
    
    const items = await prisma.media.findMany({ where: { projectId: 'clx1234567890abcdef02' } });
    console.log('Items in DB:');
    items.forEach(item => {
      console.log(`- ${item.filename} (${item.mimeType}, size: ${item.size}) -> ${item.url}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
