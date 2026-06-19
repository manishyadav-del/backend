'use client';

import { useEffect, useState } from 'react';
import { blogsApi } from '@/lib/api.js';

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
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
  });
  const [imageUploading, setImageUploading] = useState(false);

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

  const projectId = 'demo'; // TODO: Get from context/auth

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await blogsApi.getAll(projectId);
      setBlogs(data.blogs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        projectId,
        publishedAt: formData.publishedAt || null,
        scheduledAt: formData.scheduledAt || null,
      };

      if (editingBlog) {
        await blogsApi.update(editingBlog.id, submitData);
      } else {
        await blogsApi.create(submitData);
      }
      await loadBlogs();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
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
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await blogsApi.delete(id);
      await loadBlogs();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBlog(null);
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
      <div className="page-header">
        <h1>Blog Posts</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Post</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading blog posts...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">
          <p>No blog posts yet. Create your first post to get started.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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