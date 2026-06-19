import { z } from 'zod';

export const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
  banner: z.string().optional().nullable(),
  template: z.string().optional().nullable(),
  isHome: z.boolean().optional(),
});

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().optional().nullable(),
  status: z.string().optional(),
  featuredImage: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  serviceInterest: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  pageId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
});

export function validateBody(schema, body) {
  try {
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errMsgs = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { data: null, error: errMsgs };
    }
    return { data: null, error: 'Validation failed' };
  }
}
