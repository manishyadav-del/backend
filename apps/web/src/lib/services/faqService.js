import { BaseService } from './baseService.js';

export class FAQService extends BaseService {
  constructor() {
    super('fAQ');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.pageId) {
      where.pageId = queryOptions.pageId;
    }
    if (queryOptions.serviceId) {
      where.serviceId = queryOptions.serviceId;
    }
    if (queryOptions.isVisible !== undefined) {
      where.isVisible = queryOptions.isVisible === 'true' || queryOptions.isVisible === true;
    }
    return this.findAll(where, queryOptions);
  }
}

export const faqService = new FAQService();
export default faqService;
