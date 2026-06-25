import { createApiHandler } from '@/lib/apiHandler.js';
import prisma from '@/lib/prisma.js';

export const { GET } = createApiHandler({
  GET: {
    auth: 'dual',
    handler: async ({ query, project }) => {
      let projectId = project?.id || query.projectId;

      const where = {};
      if (projectId && projectId !== 'all') {
        where.projectId = projectId;
      }

      const pages = await prisma.page.findMany({
        where,
        select: {
          status: true,
          authorId: true,
        }
      });

      const total = pages.filter(p => p.status.toUpperCase() !== 'ARCHIVED').length;
      const published = pages.filter(p => p.status.toUpperCase() === 'PUBLISHED').length;
      const draft = pages.filter(p => p.status.toUpperCase() === 'DRAFT').length;
      const archived = pages.filter(p => p.status.toUpperCase() === 'ARCHIVED').length;
      const synced = pages.filter(p => p.status.toUpperCase() !== 'ARCHIVED' && !p.authorId).length;

      return {
        total,
        published,
        draft,
        archived,
        synced
      };
    }
  }
});
