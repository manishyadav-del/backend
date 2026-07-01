import prisma from '@/lib/prisma.js';
import { NotFoundError, ValidationError } from '@/lib/errorLogger.js';

export class BaseService {
  constructor(modelName) {
    this.modelName = modelName;
    this.model = prisma[modelName];
    if (!this.model) {
      throw new Error(`Model ${modelName} does not exist on Prisma client`);
    }
  }

  get defaultPageSize() {
    return parseInt(process.env.API_DEFAULT_PAGE_SIZE || '20', 10);
  }

  get maxPageSize() {
    return parseInt(process.env.API_MAX_PAGE_SIZE || '100', 10);
  }

  async execute(promise) {
    try {
      return await promise;
    } catch (error) {
      console.error(`Database error in BaseService(${this.modelName}):`, error);
      throw error;
    }
  }

  async findAll(where = {}, options = {}) {
    const queryOptions = { where };

    if (options.include) {
      queryOptions.include = options.include;
    }
    
    if (options.select) {
      queryOptions.select = options.select;
    }

    if (options.orderBy) {
      queryOptions.orderBy = options.orderBy;
    } else if (
      this.modelName === 'page' || 
      this.modelName === 'service' || 
      this.modelName === 'testimonial' || 
      this.modelName === 'contact' || 
      this.modelName === 'faq' || 
      this.modelName === 'teamMember' || 
      this.modelName === 'cTA'
    ) {
      queryOptions.orderBy = { sortOrder: 'asc' };
    } else {
      queryOptions.orderBy = { createdAt: 'desc' };
    }

    if (options.page !== undefined || options.limit !== undefined) {
      const page = Math.max(1, parseInt(options.page || '1', 10));
      let limit = parseInt(options.limit || this.defaultPageSize, 10);
      limit = Math.min(this.maxPageSize, Math.max(1, limit));

      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;

      const [items, total] = await Promise.all([
        this.execute(this.model.findMany(queryOptions)),
        this.execute(this.model.count({ where }))
      ]);

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    return this.execute(this.model.findMany(queryOptions));
  }

  async findById(id, include = null) {
    if (!id) throw new ValidationError('ID is required');
    const queryOptions = { where: { id } };
    if (include) {
      queryOptions.include = include;
    }
    const record = await this.execute(this.model.findUnique(queryOptions));
    if (!record) {
      throw new NotFoundError(`${this.modelName} with ID ${id} not found`);
    }
    return record;
  }

  async create(data, include = null) {
    const queryOptions = { data };
    if (include) {
      queryOptions.include = include;
    }
    return this.execute(this.model.create(queryOptions));
  }

  async update(id, data, include = null) {
    if (!id) throw new ValidationError('ID is required');
    await this.findById(id);

    const queryOptions = {
      where: { id },
      data
    };
    if (include) {
      queryOptions.include = include;
    }
    return this.execute(this.model.update(queryOptions));
  }

  async delete(id) {
    if (!id) throw new ValidationError('ID is required');
    await this.findById(id);

    return this.execute(this.model.delete({
      where: { id }
    }));
  }
}
