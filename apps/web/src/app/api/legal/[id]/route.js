import { createApiHandler } from '@/lib/apiHandler.js';
import { legalService } from '@/lib/services/legalService.js';
import { legalPageSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const legalPage = await legalService.findById(params.id);
      return { legalPage };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: legalPageSchema.partial(),
    handler: async ({ params, body }) => {
      const payload = { ...body };
      if (payload.content !== undefined) {
        payload.lastUpdated = new Date();
      }
      const legalPage = await legalService.update(params.id, payload);
      return { legalPage };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await legalService.delete(params.id);
      return { success: true };
    }
  }
});