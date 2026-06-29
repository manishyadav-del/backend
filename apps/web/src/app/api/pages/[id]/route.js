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
      const { id } = params ? await params : {};
      const page = await pageService.getById(id);
      return { page };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: pageUpdateSchema,
    handler: async ({ params, body, user }) => {
      const { id } = params ? await params : {};
      const page = await pageService.update(id, body, user.id);
      return { page };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const { id } = params ? await params : {};
      await pageService.delete(id);
      return { success: true };
    }
  }
});