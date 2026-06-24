export interface GlobalBackendClientConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface ProjectRoute {
  slug: string;
  path: string;
  isDynamic: boolean;
  isCatchAll?: boolean;
  type?: 'page' | 'api' | 'dynamic';
  title?: string;
  assignedModule?: RouteFeatureModule | null;
  moduleConfig?: Record<string, any> | null;
}

export type RouteFeatureModule =
  | 'cms'
  | 'blog'
  | 'seo'
  | 'forms'
  | 'legal'
  | 'analytics'
  | 'media'
  | 'settings';

export interface RouteFeatureData<T = any> {
  route: { id: string; path: string; title?: string | null; routeType?: string };
  module: RouteFeatureModule | null;
  config: Record<string, any> | null;
  data: T | null;
}


export interface SEO {
  id?: string;
  pageId?: string;
  metaTitle: string | null;
  metaDescription: string | null;
  urlSlug: string | null;
  canonical: string | null;
  ogImage: string | null;
  robots: string | null;
  llmTxt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageSection {
  id: string;
  pageId?: string;
  type: string;
  title: string | null;
  content: any;
  settings?: any;
  sortOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  parentId?: string | null;
  template?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Page {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  path: string | null;
  status: string;
  content?: string | null;
  sections?: string | null;
  banner: string | null;
  template: string | null;
  sortOrder: number;
  isHome: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  authorId?: string | null;
  visibility: string;
  password?: string | null;
  seo?: SEO | null;
  sections_rel?: PageSection[];
}

export interface AnalyticsConfig {
  googleAnalytics: string | null;
  tagManager: string | null;
  clarity: string | null;
  metaPixel: string | null;
  linkedinTag: string | null;
  searchConsole: string | null;
}

export interface Contact {
  type: string;
  label: string | null;
  value: string;
  icon: string | null;
}

export interface BrandConfig {
  logo: string | null;
  favicon: string | null;
  brandColor: string;
}

export interface Settings {
  project: {
    name: string;
    domain: string | null;
    status: string;
  };
  brand: BrandConfig;
  header: {
    sticky?: boolean;
    showCTA?: boolean;
    ctaText?: string;
    ctaLink?: string;
    transparent?: boolean;
    style?: string;
    announcementBarActive?: boolean;
    announcementBarText?: string;
    announcementBarLink?: string;
    announcementBarBgColor?: string;
    announcementBarTextColor?: string;
    menu: any[];
  };
  footer: {
    showNewsletter?: boolean;
    columns?: any;
    copyright?: string;
    socialLinks?: any[];
    menu: any[];
  };
  analytics: AnalyticsConfig;
  contacts: Contact[];
  maintenance: boolean;
  cookieConsent: boolean;
  formConsent?: boolean;
  privacyAccept?: boolean;
  marketingConsent?: boolean;
}
