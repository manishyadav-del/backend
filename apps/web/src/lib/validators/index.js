import { z } from 'zod';

export const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.preprocess(
    (val) => typeof val === 'string' ? val.toLowerCase() : val,
    z.enum(['draft', 'published', 'archived', 'scheduled'])
  ).optional(),
  banner: z.string().optional().nullable(),
  template: z.string().optional().nullable(),
  isHome: z.boolean().optional(),
});

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  status: z.string().optional(),
  publishedAt: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  targetPages: z.union([z.string(), z.array(z.string())]).optional().nullable(),
});

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  serviceInterest: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sourcePage: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  pageId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export const testimonialSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientImage: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1, 'Content is required'),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const contactSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  label: z.string().optional().nullable(),
  value: z.string().min(1, 'Value is required'),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  socialLinks: z.string().optional().nullable(), // JSON string or raw object
  sortOrder: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export const legalPageSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().nullable(),
});

export const navigationSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  items: z.string().min(1, 'Items JSON string is required'), // stored as JSON string
});

export const formSubmissionSchema = z.object({
  formType: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  data: z.string().optional().nullable(), // JSON extra fields
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const mediaSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string().min(1, 'Original name is required'),
  url: z.string().min(1, 'URL is required'),
  thumbnail: z.string().optional().nullable(),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().min(0, 'Size must be positive'),
  altText: z.string().optional().nullable(),
  folder: z.string().optional(),
});

export const ctaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  buttonText: z.string().min(1, 'Button text is required'),
  link: z.string().optional().nullable(),
  type: z.string().optional(),
  placement: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  bgColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
});


export function validateBody(schema, body) {
  try {
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const errMsgs = issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { data: null, error: errMsgs };
    }
    return { data: null, error: 'Validation failed' };
  }
}
