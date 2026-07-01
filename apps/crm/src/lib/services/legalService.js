import { BaseService } from './baseService.js';

export class LegalService extends BaseService {
  constructor() {
    super('legalPage');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.type) {
      where.type = queryOptions.type;
    }
    return this.findAll(where, {
      ...queryOptions,
      orderBy: { type: 'asc' }
    });
  }
}

export const legalService = new LegalService();
export default legalService;
