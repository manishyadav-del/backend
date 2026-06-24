import { BaseService } from './baseService.js';

export class ContactService extends BaseService {
  constructor() {
    super('contact');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.type) {
      where.type = queryOptions.type;
    }
    return this.findAll(where, queryOptions);
  }
}

export const contactService = new ContactService();
export default contactService;
