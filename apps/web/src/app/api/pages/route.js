import { createApiHandler } from '@/lib/apiHandler.js';
import { pageService } from '@/lib/services/pageService.js';
import { pageSchema } from '@/lib/validators/index.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { z } from 'zod';

const pageCreateSchema = pageSchema.extend({
  projectId: z.string().min(1, 'Project ID is required'),
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'dual',
    handler: async ({ query, project }) => {
      const projectId = project?.id || query.projectId || 'all';
      const result = await pageService.getAll(projectId, query);
      const pages = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        pages,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: pageCreateSchema,
    handler: async ({ body, user }) => {
      const page = await pageService.create(body, user.id);
      return { page };
    }
  }
});