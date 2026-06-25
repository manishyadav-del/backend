'use client';

import { useEffect, useState } from 'react';
import { blogsApi } from '@/lib/api.js';

export default function BlogPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [isSlugModified, setIsSlugModified] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    category: '',
    featuredImage: '',
    author: '',
    status: 'draft',
    publishedAt: '',
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
    targetPages: [],
  });
  const [availablePages, setAvailablePages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projList = data.projects || [];
        setProjects(projList);
        if (projList.length > 0) {
          setProjectId(projList[0].id);
        }
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
      });
  }, []);

  useEffect(() => {
    if (projectId) {
      loadBlogs(projectId);
      // Fetch available pages for this project
      fetch(`/api/pages?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => {
          setAvailablePages(data.pages || []);
        })
        .catch(err => {
          console.error('Error fetching pages:', err);
          setAvailablePages([]);
        });
    } else {
      setBlogs([]);
      setAvailablePages([]);
      setLoading(false);
    }
  }, [projectId]);

  const loadBlogs = async (pid = projectId) => {
    if (!pid) return;
    try {
      setLoading(true);
      const data = await blogsApi.getAll(pid);
      setBlogs(data.blogs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('projectId', projectId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, featuredImage: data.url }));
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Upload error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleTitleChange = (val) => {
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    setFormData(prev => ({
      ...prev,
      title: val,
      slug: isSlugModified ? prev.slug : generatedSlug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let slug = formData.slug ? formData.slug.trim() : '';
      if (!slug && formData.title) {
        slug = formData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }

      const submitData = {
        ...formData,
        slug,
        projectId,
        publishedAt: formData.publishedAt || null,
        scheduledAt: formData.scheduledAt || null,
      };

      if (editingBlog) {
        await blogsApi.update(editingBlog.id, submitData);
      } else {
        await blogsApi.create(submitData);
      }
      await loadBlogs(projectId);
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setIsSlugModified(true);
    let targeted = [];
    if (blog.targetPages) {
      try {
        targeted = typeof blog.targetPages === 'string' ? JSON.parse(blog.targetPages) : blog.targetPages;
      } catch (e) {
        targeted = [];
      }
    }
    setFormData({
      title: blog.title || '',
      content: blog.content || '',
      excerpt: blog.excerpt || '',
      slug: blog.slug || '',
      category: blog.category || '',
      featuredImage: blog.featuredImage || '',
      author: blog.author || '',
      status: blog.status || 'draft',
      publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().split('T')[0] : '',
      scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt).toISOString().split('T')[0] : '',
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
      targetPages: targeted || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await blogsApi.delete(id);
      await loadBlogs(projectId);
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBlog(null);
    setIsSlugModified(false);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      category: '',
      featuredImage: '',
      author: '',
      status: 'draft',
      publishedAt: '',
      scheduledAt: '',
      seoTitle: '',
      seoDescription: '',
      targetPages: [],
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-draft',
      published: 'badge-published',
      scheduled: 'badge-scheduled',
    };
    return badges[status] || 'badge-draft';
  };

  return (
    <div className="blog-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Blog Posts</h1>
          {projects.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'gray' }}>Project:</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  background: '#fff',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                background: viewMode === 'table' ? '#4f46e5' : '#fff',
                color: viewMode === 'table' ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('card')}
              style={{
                padding: '0.35rem 0.75rem',
                border: 'none',
                background: viewMode === 'card' ? '#4f46e5' : '#fff',
                color: viewMode === 'card' ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Cards
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ New Post</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading blog posts...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">
          <p>No blog posts yet. Create your first post to get started.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Target Pages</th>
                <th>Author</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog.id}>
                  <td>
                    <strong>{blog.title}</strong>
                    {blog.featuredImage && <div className="thumbnail-preview"><img src={blog.featuredImage} alt="" /></div>}
                  </td>
                  <td>{blog.category || '-'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(blog.status)}`}>{blog.status}</span>
                  </td>
                  <td>
                    {blog.targetPages && (() => {
                      try {
                        const arr = typeof blog.targetPages === 'string' ? JSON.parse(blog.targetPages) : blog.targetPages;
                        if (Array.isArray(arr) && arr.length > 0) {
                          return (
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {arr.map(p => (
                                <span key={p} style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          );
                        }
                      } catch(e) {}
                      return <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Global</span>;
                    })()}
                  </td>
                  <td>{blog.author || '-'}</td>
                  <td>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(blog)} className="btn-sm">Edit</button>
                      <button onClick={() => handleDelete(blog.id)} className="btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          {blogs.map(blog => (
            <div key={blog.id} style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                {blog.featuredImage ? (
                  <img src={blog.featuredImage} alt={blog.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '160px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                    No Image
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase' }}>{blog.category || 'Uncategorized'}</span>
                    <span className={`badge ${getStatusBadge(blog.status)}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{blog.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#111827', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blog.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blog.excerpt || (blog.content && blog.content.replace(/<[^>]*>/g, '').slice(0, 120)) || 'No description available...'}</p>
                  {blog.targetPages && (() => {
                    try {
                      const arr = typeof blog.targetPages === 'string' ? JSON.parse(blog.targetPages) : blog.targetPages;
                      if (Array.isArray(arr) && arr.length > 0) {
                        return (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {arr.map(p => (
                              <span key={p} style={{ fontSize: '0.65rem', background: '#e0e7ff', color: '#4338ca', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>
                                📌 {p}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    } catch(e) {}
                    return null;
                  })()}
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>By {blog.author || 'Admin'}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(blog)} className="btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
                  <button onClick={() => handleDelete(blog.id)} className="btn-sm btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBlog ? 'Edit Blog Post' : 'New Blog Post'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugModified(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    placeholder="auto-generated-from-title"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="8"
                />
              </div>
              <div className="form-group">
                <label>Featured Image</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="https://... or upload file"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="file"
                    id="blog-image-file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-sm"
                    style={{ height: '40px', display: 'flex', alignItems: 'center' }}
                    onClick={() => document.getElementById('blog-image-file').click()}
                    disabled={imageUploading}
                  >
                    {imageUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Published Date</label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>SEO Title</label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>SEO Description</label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Target Pages (Select where this blog should be posted)</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  padding: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  background: '#f9f9f9',
                  color: '#333'
                }}>
                  {availablePages.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>No pages registered for this project.</span>
                  ) : (
                    availablePages.map(p => {
                      const pagePath = p.slug.startsWith('/') ? p.slug : `/${p.slug}`;
                      const isChecked = formData.targetPages.includes(pagePath);
                      return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...formData.targetPages, pagePath]
                                : formData.targetPages.filter(x => x !== pagePath);
                              setFormData({ ...formData, targetPages: updated });
                            }}
                          />
                          {p.title} ({pagePath})
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingBlog ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}