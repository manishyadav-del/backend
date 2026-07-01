import { createApiHandler } from '@/lib/apiHandler.js';
import { leadService } from '@/lib/services/leadService.js';
import { leadSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const leadCreateSchema = leadSchema.extend({
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
      const result = await leadService.getAll(projectId, query);
      const leads = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        leads,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: leadCreateSchema,
    handler: async ({ body }) => {
      const lead = await leadService.create(body);
      return { lead };
    }
  }
});