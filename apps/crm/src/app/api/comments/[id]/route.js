import { createApiHandler } from '@/lib/apiHandler.js';
import { commentService } from '@/lib/services/commentService.js';
import { z } from 'zod';

const commentUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'spam', 'trash']),
  content: z.string().optional(),
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const comment = await commentService.findById(params.id);
      return { comment };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: commentUpdateSchema,
    handler: async ({ params, body }) => {
      const comment = await commentService.update(params.id, body);
      return { comment };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await commentService.delete(params.id);
      return { success: true };
    }
  }
});
