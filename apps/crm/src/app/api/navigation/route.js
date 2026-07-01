import { createApiHandler } from '@/lib/apiHandler.js';
import { navigationService } from '@/lib/services/navigationService.js';
import { ValidationError } from '@/lib/errorLogger.js';
import { z } from 'zod';

const navigationCreateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  location: z.string().min(1, 'Location is required'),
  items: z.any()
});

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'public',
    handler: async ({ query }) => {
      const projectId = query.projectId;
      if (!projectId) {
        throw new ValidationError('Project ID required');
      }
      const menus = await navigationService.getAll(projectId, query);
      return { menus };
    }
  },
  POST: {
    auth: 'jwt',
    schema: navigationCreateSchema,
    handler: async ({ body }) => {
      const menu = await navigationService.create(body);
      return { menu };
    }
  }
});