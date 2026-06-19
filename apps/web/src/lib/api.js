// Reusable API utility functions for frontend

const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Generic CRUD operations
export const api = {
  // GET all items
  getAll: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/${endpoint}${queryString ? `?${queryString}` : ''}`);
  },

  // GET single item
  getById: (endpoint, id) => apiFetch(`/${endpoint}/${id}`),

  // CREATE new item
  create: (endpoint, data) => apiFetch(`/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // UPDATE item
  update: (endpoint, id, data) => apiFetch(`/${endpoint}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // DELETE item
  delete: (endpoint, id) => apiFetch(`/${endpoint}/${id}`, {
    method: 'DELETE',
  }),
};

// Specific API modules
export const pagesApi = {
  getAll: (projectId) => api.getAll('pages', { projectId }),
  getById: (id) => api.getById('pages', id),
  create: (data) => api.create('pages', data),
  update: (id, data) => api.update('pages', id, data),
  delete: (id) => api.delete('pages', id),
};

export const servicesApi = {
  getAll: (projectId) => api.getAll('services', { projectId }),
  getById: (id) => api.getById('services', id),
  create: (data) => api.create('services', data),
  update: (id, data) => api.update('services', id, data),
  delete: (id) => api.delete('services', id),
};

export const blogsApi = {
  getAll: (projectId) => api.getAll('blogs', { projectId }),
  getById: (id) => api.getById('blogs', id),
  create: (data) => api.create('blogs', data),
  update: (id, data) => api.update('blogs', id, data),
  delete: (id) => api.delete('blogs', id),
};

export const mediaApi = {
  getAll: (projectId) => api.getAll('media', { projectId }),
  getById: (id) => api.getById('media', id),
  create: (data) => api.create('media', data),
  update: (id, data) => api.update('media', id, data),
  delete: (id) => api.delete('media', id),
};

export const contactsApi = {
  getAll: (projectId) => api.getAll('contacts', { projectId }),
  getById: (id) => api.getById('contacts', id),
  create: (data) => api.create('contacts', data),
  update: (id, data) => api.update('contacts', id, data),
  delete: (id) => api.delete('contacts', id),
};

export const testimonialsApi = {
  getAll: (projectId) => api.getAll('testimonials', { projectId }),
  getById: (id) => api.getById('testimonials', id),
  create: (data) => api.create('testimonials', data),
  update: (id, data) => api.update('testimonials', id, data),
  delete: (id) => api.delete('testimonials', id),
};

export const faqsApi = {
  getAll: (projectId) => api.getAll('faqs', { projectId }),
  getById: (id) => api.getById('faqs', id),
  create: (data) => api.create('faqs', data),
  update: (id, data) => api.update('faqs', id, data),
  delete: (id) => api.delete('faqs', id),
};

export const teamApi = {
  getAll: (projectId) => api.getAll('team', { projectId }),
  getById: (id) => api.getById('team', id),
  create: (data) => api.create('team', data),
  update: (id, data) => api.update('team', id, data),
  delete: (id) => api.delete('team', id),
};

export const legalApi = {
  getAll: (projectId) => api.getAll('legal', { projectId }),
  getById: (id) => api.getById('legal', id),
  create: (data) => api.create('legal', data),
  update: (id, data) => api.update('legal', id, data),
  delete: (id) => api.delete('legal', id),
};

export const navigationApi = {
  getAll: (projectId) => api.getAll('navigation', { projectId }),
  getById: (id) => api.getById('navigation', id),
  create: (data) => api.create('navigation', data),
  update: (id, data) => api.update('navigation', id, data),
  delete: (id) => api.delete('navigation', id),
};

export const formsApi = {
  getAll: (projectId) => api.getAll('forms', { projectId }),
  getById: (id) => api.getById('forms', id),
  update: (id, data) => api.update('forms', id, data),
  delete: (id) => api.delete('forms', id),
};

export const seoApi = {
  getAll: (projectId) => api.getAll('seo', { projectId }),
  getById: (id) => api.getById('seo', id),
  update: (id, data) => api.update('seo', id, data),
};

export const leadsApi = {
  getAll: (projectId) => api.getAll('leads', { projectId }),
  getById: (id) => api.getById('leads', id),
  create: (data) => api.create('leads', data),
  update: (id, data) => api.update('leads', id, data),
  delete: (id) => api.delete('leads', id),
};

export const notificationsApi = {
  getAll: (projectId) => api.getAll('notifications', { projectId }),
  getById: (id) => api.getById('notifications', id),
  create: (data) => api.create('notifications', data),
  update: (id, data) => api.update('notifications', id, data),
  delete: (id) => api.delete('notifications', id),
};

export const backupApi = {
  getAll: (projectId) => api.getAll('backup', { projectId }),
  getById: (id) => api.getById('backup', id),
  create: (data) => api.create('backup', data),
  update: (id, data) => api.update('backup', id, data),
  delete: (id) => api.delete('backup', id),
};

export const redirectsApi = {
  getAll: (projectId) => api.getAll('redirects', { projectId }),
  getById: (id) => api.getById('redirects', id),
  create: (data) => api.create('redirects', data),
  update: (id, data) => api.update('redirects', id, data),
  delete: (id) => api.delete('redirects', id),
};

export const emailSettingsApi = {
  get: (projectId) => apiFetch(`/email-settings?projectId=${projectId}`),
  save: (data) => apiFetch('/email-settings', { method: 'POST', body: JSON.stringify(data) }),
};

export const settingsApi = {
  get: () => apiFetch('/api/auth/me'),
  update: (data) => apiFetch('/api/api-key', { method: 'PUT', body: JSON.stringify(data) }),
};
