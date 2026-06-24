import { BaseService } from './baseService.js';
import { createNotification } from '@/lib/notify.js';

export class LeadService extends BaseService {
  constructor() {
    super('lead');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.status) {
      where.status = queryOptions.status;
    }
    return this.findAll(where, queryOptions);
  }

  async create(data) {
    const lead = await super.create(data);
    
    // Generate auto-notification
    await createNotification(
      lead.projectId,
      'lead',
      'New Lead Registered',
      `Lead ${lead.name || lead.email || 'Anonymous'} has registered interest in ${lead.serviceInterest || 'general'}.`,
      '/dashboard/leads'
    );

    return lead;
  }
}

export const leadService = new LeadService();
export default leadService;
