import { createApiHandler } from '@/lib/apiHandler.js';
import { faqService } from '@/lib/services/faqService.js';
import { faqSchema } from '@/lib/validators/index.js';
import { z } from 'zod';

const faqUpdateSchema = faqSchema.partial().extend({
  projectId: z.string().optional()
});

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const faq = await faqService.findById(params.id);
      return { faq };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: faqUpdateSchema,
    handler: async ({ params, body }) => {
      const faq = await faqService.update(params.id, body);
      return { faq };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await faqService.delete(params.id);
      return { success: true };
    }
  }
});