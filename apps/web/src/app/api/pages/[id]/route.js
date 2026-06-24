import { createApiHandler } from '@/lib/apiHandler.js';
import { pageService } from '@/lib/services/pageService.js';
import { pageSchema } from '@/lib/validators/index.js';
import { z } from 'zod';

const pageUpdateSchema = pageSchema.partial().extend({
  seo: z.any().optional(),
  changeLog: z.string().optional(),
  visibility: z.string().optional(),
  password: z.string().optional().nullable(),
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const page = await pageService.getById(params.id);
      return { page };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: pageUpdateSchema,
    handler: async ({ params, body, user }) => {
      const page = await pageService.update(params.id, body, user.id);
      return { page };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await pageService.delete(params.id);
      return { success: true };
    }
  }
});