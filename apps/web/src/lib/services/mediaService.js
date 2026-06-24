import { BaseService } from './baseService.js';

export class MediaService extends BaseService {
  constructor() {
    super('media');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.folder) {
      where.folder = queryOptions.folder;
    }
    return this.findAll(where, queryOptions);
  }
}

export const mediaService = new MediaService();
export default mediaService;
