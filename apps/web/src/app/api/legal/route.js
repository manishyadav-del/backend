import { createApiHandler } from '@/lib/apiHandler.js';
import { legalService } from '@/lib/services/legalService.js';
import { legalPageSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const legalPageCreateSchema = legalPageSchema.extend({
  projectId: z.string().min(1, 'Project ID is required'),
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const result = await legalService.getAll(projectId, query);
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
    schema: legalPageCreateSchema,
    handler: async ({ body }) => {
      const page = await legalService.create(body);
      return { page };
    }
  }
});