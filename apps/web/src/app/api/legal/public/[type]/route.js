import { createApiHandler } from '@/lib/apiHandler.js';
import prisma from '@/lib/prisma.js';
import { ValidationError } from '@/lib/errorLogger.js';

export const { GET } = createApiHandler({
  GET: {
    auth: 'apiKey',
    handler: async ({ params, project }) => {
      const awaitedParams = params ? await params : {};
      const type = awaitedParams.type;

      if (!type) {
        throw new ValidationError('Legal page type is required');
      }

      const legalPage = await prisma.legalPage.findFirst({
        where: {
          projectId: project.id,
          type: type
        }
      });

      return { success: true, legalPage };
    }
  }
});
