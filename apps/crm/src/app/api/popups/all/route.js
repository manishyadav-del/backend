import { createApiHandler } from '@/lib/apiHandler.js';
import prisma from '@/lib/prisma.js';

/**
 * GET /api/popups/all
 * Returns ALL popups across every project. Requires JWT auth.
 */
export const { GET } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const search    = query.search || '';
      const projectId = query.projectId || null;
      const type      = query.type || null;

      const where = {};
      if (projectId) where.projectId = projectId;
      if (type)      where.type = type;
      if (search) {
        where.OR = [
          { title:   { contains: search } },
          { content: { contains: search } },
        ];
      }

      const popups = await prisma.popup.findMany({
        where,
        orderBy: [{ projectId: 'asc' }, { createdAt: 'desc' }],
      });

      // Fetch projects separately to avoid FK issues
      const projects = await prisma.project.findMany({
        select: { id: true, name: true }
      });
      const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

      const popupsWithProject = popups.map(p => ({
        ...p,
        project: projectMap[p.projectId] || { id: p.projectId, name: p.projectId },
      }));

      return { popups: popupsWithProject, total: popups.length };
    }
  }
});
