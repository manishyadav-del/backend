import { createApiHandler } from '@/lib/apiHandler.js';
import { categoryService } from '@/lib/services/categoryService.js';
import { z } from 'zod';

const categoryUpdateSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const category = await categoryService.findById(params.id);
      return { category };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: categoryUpdateSchema,
    handler: async ({ params, body }) => {
      const category = await categoryService.update(params.id, body);
      return { category };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await categoryService.delete(params.id);
      return { success: true };
    }
  }
});
