import { createApiHandler } from '@/lib/apiHandler.js';
import { settingsService } from '@/lib/services/settingsService.js';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export const { GET } = createApiHandler({
  GET: {
    auth: 'jwt',
    handler: async ({ query }) => {
      const projectId = query.projectId || 'default';
      const data = await settingsService.getDashboardStats(projectId);
      return { success: true, data };
    }
  }
});