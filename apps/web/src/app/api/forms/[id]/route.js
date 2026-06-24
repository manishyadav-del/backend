import { createApiHandler } from '@/lib/apiHandler.js';
import { formService } from '@/lib/services/formService.js';
import { formSubmissionSchema } from '@/lib/validators/index.js';

export const { GET, PUT, DELETE } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ params }) => {
      const formSubmission = await formService.findById(params.id);
      return { formSubmission };
    }
  },
  PUT: {
    auth: 'jwt',
    schema: formSubmissionSchema.partial(),
    handler: async ({ params, body }) => {
      const formSubmission = await formService.update(params.id, body);
      return { formSubmission };
    }
  },
  DELETE: {
    auth: 'jwt',
    handler: async ({ params }) => {
      await formService.delete(params.id);
      return { success: true };
    }
  }
});