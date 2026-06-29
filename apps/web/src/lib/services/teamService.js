import { BaseService } from './baseService.js';
import { settingsService } from './settingsService.js';

export class TeamService extends BaseService {
  constructor() {
    super('teamMember');
  }

  async getAll(projectId, queryOptions = {}) {
    const resolvedId = await settingsService.resolveProjectId(projectId);
    const where = { projectId: resolvedId };
    if (queryOptions.isVisible !== undefined) {
      where.isVisible = queryOptions.isVisible === 'true' || queryOptions.isVisible === true;
    }
    return this.findAll(where, queryOptions);
  }
}

export const teamService = new TeamService();
export default teamService;
