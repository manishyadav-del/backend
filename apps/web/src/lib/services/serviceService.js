import { BaseService } from './baseService.js';
import prisma from '@/lib/prisma.js';
import { createNotification } from '@/lib/notify.js';

export class ServiceService extends BaseService {
  constructor() {
    super('service');
  }

  async getAll(projectId, queryOptions = {}) {
    const where = { projectId };
    if (queryOptions.search) {
      where.OR = [
        { title: { contains: queryOptions.search } },
        { description: { contains: queryOptions.search } }
      ];
    }
    return this.findAll(where, queryOptions);
  }

  async getById(id) {
    return this.findById(id, {
      faqs: { select: { id: true } }
    });
  }

  async create(data) {
    const { faqIds, ...serviceData } = data;
    const service = await super.create(serviceData);

    if (faqIds && faqIds.length > 0) {
      await prisma.fAQ.updateMany({
        where: { id: { in: faqIds } },
        data: { serviceId: service.id },
      });
    }

    await createNotification(
      service.projectId,
      'service',
      'New Service Added',
      `Service "${service.title}" has been added.`,
      '/admin/services'
    );

    return service;
  }

  async update(id, data) {
    const { faqIds, ...serviceData } = data;
    const service = await super.update(id, serviceData);

    if (faqIds !== undefined) {
      // Disconnect all previous FAQs for this service
      await prisma.fAQ.updateMany({
        where: { serviceId: id },
        data: { serviceId: null },
      });
      // Connect new FAQs
      if (faqIds.length > 0) {
        await prisma.fAQ.updateMany({
          where: { id: { in: faqIds } },
          data: { serviceId: id },
        });
      }
    }

    await createNotification(
      service.projectId,
      'service',
      'Service Updated',
      `Service "${service.title}" has been updated.`,
      '/admin/services'
    );

    return service;
  }

  async delete(id) {
    const service = await this.findById(id);
    const result = await super.delete(id);
    await createNotification(
      service.projectId,
      'service',
      'Service Deleted',
      `Service "${service.title}" has been deleted.`,
      '/admin/services'
    );
    return result;
  }
}

export const serviceService = new ServiceService();
export default serviceService;
