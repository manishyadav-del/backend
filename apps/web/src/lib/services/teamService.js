import { BaseService } from './baseService.js';

export class TeamService extends BaseService {
  constructor() {
    super('teamMember');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.isVisible !== undefined) {
      where.isVisible = queryOptions.isVisible === 'true' || queryOptions.isVisible === true;
    }
    return this.findAll(where, queryOptions);
  }
}

export const teamService = new TeamService();
export default teamService;
