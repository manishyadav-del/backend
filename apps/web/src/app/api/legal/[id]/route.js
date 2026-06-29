import { createApiHandler } from '@/lib/apiHandler.js';
import { legalService } from '@/lib/services/legalService.js';
import { legalPageSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const { id } = params ? await params : {};
      const legalPage = await legalService.findById(id);
      return { legalPage };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: legalPageSchema.partial(),
    handler: async ({ params, body }) => {
      const { id } = params ? await params : {};
      const payload = { ...body };
      if (payload.content !== undefined) {
        payload.lastUpdated = new Date();
      }
      const legalPage = await legalService.update(id, payload);
      return { legalPage };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const { id } = params ? await params : {};
      await legalService.delete(id);
      return { success: true };
    }
  }
});