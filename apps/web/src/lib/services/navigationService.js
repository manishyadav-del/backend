import { BaseService } from './baseService.js';

export class NavigationService extends BaseService {
  constructor() {
    super('navigation');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    return this.findAll(where, {
      ...queryOptions,
      orderBy: { location: 'asc' }
    });
  }

  async create(data) {
    const payload = { ...data };
    if (payload.items && typeof payload.items !== 'string') {
      payload.items = JSON.stringify(payload.items);
    }
    return super.create(payload);
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.items && typeof payload.items !== 'string') {
      payload.items = JSON.stringify(payload.items);
    }
    return super.update(id, payload);
  }
}

export const navigationService = new NavigationService();
export default navigationService;
