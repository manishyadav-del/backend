import { createApiHandler } from '@/lib/apiHandler.js';
import prisma from '@/lib/prisma.js';

/**
 * GET /api/services/all
 * Returns ALL services across every project, with project/website info attached.
 * Handles orphaned projectId references gracefully.
 * Requires JWT auth.
 */
export const { GET } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const search = query.search || '';
      const filterProjectId = query.projectId || null;

      const where = {};
      if (filterProjectId) where.projectId = filterProjectId;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }

      // Fetch all services (without project include to avoid FK issues on orphaned IDs)
      const services = await prisma.service.findMany({
        where,
        orderBy: [{ projectId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          faqs: {
            select: { id: true, question: true },
            where: { isVisible: true },
          }
        }
      });

      // Fetch all projects separately
      const projects = await prisma.project.findMany({
        select: { id: true, name: true, apiKey: true, domain: true }
      });
      const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

      // Attach project info manually (handles orphaned IDs)
      const servicesWithProject = services.map(svc => ({
        ...svc,
        project: projectMap[svc.projectId] || { 
          id: svc.projectId, 
          name: svc.projectId, // fallback: show the raw ID
          apiKey: '', 
          domain: '' 
        },
      }));

      // Group by project
      const groupMap = {};
      for (const svc of servicesWithProject) {
        const pid = svc.projectId;
        if (!groupMap[pid]) {
          groupMap[pid] = {
            project: svc.project,
            services: [],
          };
        }
        groupMap[pid].services.push(svc);
      }

      return {
        services: servicesWithProject,
        grouped: Object.values(groupMap),
        total: services.length,
        projectCount: Object.keys(groupMap).length,
      };
    }
  }
});
