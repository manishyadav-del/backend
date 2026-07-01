import { createApiHandler } from '@/lib/apiHandler.js';
import { pageService } from '@/lib/services/pageService.js';

export const { PUT, DELETE } = createApiHandler({
  PUT: {
    auth: 'jwt',
    handler: async ({ params, body }) => {
      const page = await pageService.updateLegacy(params.id, body);
      return { page };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await pageService.softDelete(params.id);
      return { success: true };
    }
  }
});
