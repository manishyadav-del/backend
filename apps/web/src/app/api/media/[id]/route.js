import { createApiHandler } from '@/lib/apiHandler.js';
import { mediaService } from '@/lib/services/mediaService.js';
import { mediaSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const media = await mediaService.findById(params.id);
      return { media };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: mediaSchema.partial(),
    handler: async ({ params, body }) => {
      const media = await mediaService.update(params.id, body);
      return { media };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await mediaService.delete(params.id);
      return { success: true };
    }
  }
});