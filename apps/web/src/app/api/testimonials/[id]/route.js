import { createApiHandler } from '@/lib/apiHandler.js';
import { testimonialService } from '@/lib/services/testimonialService.js';
import { testimonialSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const testimonial = await testimonialService.findById(params.id);
      return { testimonial };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: testimonialSchema.partial(),
    handler: async ({ params, body }) => {
      const testimonial = await testimonialService.update(params.id, body);
      return { testimonial };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await testimonialService.delete(params.id);
      return { success: true };
    }
  }
});