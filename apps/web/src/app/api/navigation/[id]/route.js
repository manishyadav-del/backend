import { createApiHandler } from '@/lib/apiHandler.js';
import { navigationService } from '@/lib/services/navigationService.js';
import { z } from 'zod';

const navigationUpdateSchema = z.object({
  location: z.string().optional(),
  items: z.any().optional()
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const navigation = await navigationService.findById(params.id);
      return { navigation };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: navigationUpdateSchema,
    handler: async ({ params, body }) => {
      const navigation = await navigationService.update(params.id, body);
      return { navigation };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await navigationService.delete(params.id);
      return { success: true };
    }
  }
});