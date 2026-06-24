import { BaseService } from './baseService.js';
import { createNotification } from '@/lib/notify.js';

export class FormService extends BaseService {
  constructor() {
    super('formSubmission');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.formType) {
      where.formType = queryOptions.formType;
    }
    return this.findAll(where, queryOptions);
  }

  async create(data) {
    const submission = await super.create(data);

    // Generate auto-notification
    await createNotification(
      submission.projectId,
      'form',
      'New Form Submission',
      `Received a new ${submission.formType || 'contact'} submission from ${submission.name || submission.email || 'Anonymous'}.`,
      '/dashboard/leads'
    );

    return submission;
  }
}

export const formService = new FormService();
export default formService;
