import { BaseService } from './baseService.js';

export class TestimonialService extends BaseService {
  constructor() {
    super('testimonial');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.isVisible !== undefined) {
      where.isVisible = queryOptions.isVisible === 'true' || queryOptions.isVisible === true;
    }
    return this.findAll(where, queryOptions);
  }
}

export const testimonialService = new TestimonialService();
export default testimonialService;
