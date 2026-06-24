import { createApiHandler } from '@/lib/apiHandler.js';
import { settingsService } from '@/lib/services/settingsService.js';
import { ValidationError } from '@/lib/errorLogger.js';

export const { GET, POST } = createApiHandler({
  GET: {
    auth: 'public',
    handler: async ({ query }) => {
      const apiKey = query.apiKey;
      if (!apiKey) {
        throw new ValidationError('API key is required');
      }
      const data = await settingsService.getGlobalSettings(apiKey);
      return { success: true, data };
    }
  },
  POST: {
    auth: 'jwt',
    handler: async ({ body, user }) => {
      const { projectId, ...settingsToUpdate } = body;
      const settings = await settingsService.updateGlobalSettings(projectId, settingsToUpdate, user.id);
      return { success: true, data: settings };
    }
  }
});