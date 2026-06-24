import { createApiHandler } from '@/lib/apiHandler.js';
import { serviceService } from '@/lib/services/serviceService.js';
import { serviceSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const serviceCreateSchema = serviceSchema.extend({
  projectId: z.string().min(1, 'Project ID is required'),
  faqIds: z.array(z.string()).optional(),
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const result = await serviceService.getAll(projectId, query);
      const services = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        services,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: serviceCreateSchema,
    handler: async ({ body }) => {
      const service = await serviceService.create(body);
      return { service };
    }
  }
});