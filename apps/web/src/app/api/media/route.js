import { createApiHandler } from '@/lib/apiHandler.js';
import { mediaService } from '@/lib/services/mediaService.js';
import { mediaSchema } from '@/lib/validators/index.js';
import { z } from 'zod';
import { ValidationError } from '@/lib/errorLogger.js';

const mediaCreateSchema = mediaSchema.extend({
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
      const result = await mediaService.getAll(projectId, query);
      const media = Array.isArray(result) ? result : result.items;
      const pagination = Array.isArray(result) ? null : result.pagination;
      return { 
        media,
        ...(pagination && { pagination })
      };
    }
  },
  POST: {
    auth: 'jwt',
    schema: mediaCreateSchema,
    handler: async ({ body }) => {
      const media = await mediaService.create(body);
      return { media };
    }
  }
});