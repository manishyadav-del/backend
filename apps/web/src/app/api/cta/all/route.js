import { createApiHandler } from '@/lib/apiHandler.js';
import prisma from '@/lib/prisma.js';

/**
 * GET /api/cta/all
 * Returns ALL CTAs across every project. Requires JWT auth.
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
          { title:      { contains: search } },
          { buttonText: { contains: search } },
          { link:       { contains: search } },
        ];
      }

      const ctas = await prisma.cTA.findMany({
        where,
        orderBy: [{ projectId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      });

      // Fetch projects separately to avoid FK issues
      const projects = await prisma.project.findMany({
        select: { id: true, name: true }
      });
      const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

      const ctasWithProject = ctas.map(c => ({
        ...c,
        project: projectMap[c.projectId] || { id: c.projectId, name: c.projectId },
      }));

      return { ctas: ctasWithProject, total: ctas.length };
    }
  }
});
