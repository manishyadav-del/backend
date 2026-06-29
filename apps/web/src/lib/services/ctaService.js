import { BaseService } from './baseService.js';

export class CtaService extends BaseService {
  constructor() {
    super('cTA');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.type) {
      where.type = queryOptions.type;
    }
    if (queryOptions.isActive !== undefined) {
      where.isActive = queryOptions.isActive === 'true' || queryOptions.isActive === true;
    }
    return this.findAll(where, queryOptions);
  }
}

export const ctaService = new CtaService();
export default ctaService;
