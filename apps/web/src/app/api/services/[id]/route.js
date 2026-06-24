import { createApiHandler } from '@/lib/apiHandler.js';
import { serviceService } from '@/lib/services/serviceService.js';
import { serviceSchema } from '@/lib/validators/index.js';
import { z } from 'zod';

const serviceUpdateSchema = serviceSchema.partial().extend({
  faqIds: z.array(z.string()).optional()
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const service = await serviceService.getById(params.id);
      return { service };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: serviceUpdateSchema,
    handler: async ({ params, body }) => {
      const service = await serviceService.update(params.id, body);
      return { service };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await serviceService.delete(params.id);
      return { success: true };
    }
  }
});