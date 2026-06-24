import { createApiHandler } from '@/lib/apiHandler.js';
import { blogService } from '@/lib/services/blogService.js';
import { blogSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const blog = await blogService.findById(params.id);
      return { blog };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: blogSchema.partial(), // allow partial updates
    handler: async ({ params, body }) => {
      const blog = await blogService.update(params.id, body);
      return { blog };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await blogService.delete(params.id);
      return { success: true };
    }
  }
});