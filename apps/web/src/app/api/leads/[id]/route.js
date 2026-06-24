import { createApiHandler } from '@/lib/apiHandler.js';
import { leadService } from '@/lib/services/leadService.js';
import { leadSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const lead = await leadService.findById(params.id);
      return { lead };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: leadSchema.partial(),
    handler: async ({ params, body }) => {
      const lead = await leadService.update(params.id, body);
      return { lead };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await leadService.delete(params.id);
      return { success: true };
    }
  }
});