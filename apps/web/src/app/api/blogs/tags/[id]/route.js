import { createApiHandler } from '@/lib/apiHandler.js';
import { tagService } from '@/lib/services/tagService.js';
import { z } from 'zod';

const tagUpdateSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const tag = await tagService.findById(params.id);
      return { tag };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: tagUpdateSchema,
    handler: async ({ params, body }) => {
      const tag = await tagService.update(params.id, body);
      return { tag };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await tagService.delete(params.id);
      return { success: true };
    }
  }
});
