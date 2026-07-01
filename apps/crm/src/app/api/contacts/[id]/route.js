import { createApiHandler } from '@/lib/apiHandler.js';
import { contactService } from '@/lib/services/contactService.js';
import { contactSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const contact = await contactService.findById(params.id);
      return { contact };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: contactSchema.partial(),
    handler: async ({ params, body }) => {
      const contact = await contactService.update(params.id, body);
      return { contact };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await contactService.delete(params.id);
      return { success: true };
    }
  }
});