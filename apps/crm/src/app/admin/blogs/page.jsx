'use client';

import { useEffect, useState, useRef } from 'react';
import { blogsApi } from '@/lib/api.js';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import { htmlToBlocks, blocksToHtml } from './parser.js';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });
const BlockEditor = dynamic(() => import('./BlockEditor'), { ssr: false });

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
  const [editorMode, setEditorMode] = useState('block'); // 'block' or 'classic'
  const [blocksValue, setBlocksValue] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [users, setUsers] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const blocksValueRef = useRef([]);
  blocksValueRef.current = blocksValue;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    category: '',
    categoryId: '',
    featuredImage: '',
    author: '',
    authorId: '',
    status: 'draft',
    publishedAt: '',
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
    targetPages: [],
    tags: [], // array of tag IDs
  });

  const [availablePages, setAvailablePages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryVal, setNewCategoryVal] = useState('');
  const [isNewTag, setIsNewTag] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');

  // Initial projects fetch
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

    // Fetch users for Author selection
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
      })
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  // Fetch taxonomy, pages, and media when project changes
  useEffect(() => {
    if (projectId) {
      loadBlogs(projectId);
      
      // Fetch pages
      fetch(`/api/pages?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => setAvailablePages(data.pages || []))
        .catch(err => console.error('Error fetching pages:', err));

      // Fetch categories
      fetch(`/api/blogs/categories?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => setCategories(data.categories || []))
        .catch(err => console.error('Error fetching categories:', err));

      // Fetch tags
      fetch(`/api/blogs/tags?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => setTagsList(data.tags || []))
        .catch(err => console.error('Error fetching tags:', err));

      // Fetch media
      fetch(`/api/media?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => setMediaList(data.media || []))
        .catch(err => console.error('Error fetching media:', err));
    } else {
      setBlogs([]);
      setAvailablePages([]);
      setCategories([]);
      setTagsList([]);
      setMediaList([]);
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
        Swal.fire('Success', 'Image uploaded successfully!', 'success');
      } else {
        Swal.fire('Error', data.error || 'Failed to upload image', 'error');
      }
    } catch {
      Swal.fire('Error', 'Upload error', 'error');
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

  const handleCreateCategory = async () => {
    if (!newCategoryVal.trim()) return;
    try {
      const slug = newCategoryVal.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const res = await fetch('/api/blogs/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryVal, slug, projectId })
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(prev => [...prev, data.category]);
        setFormData(prev => ({ ...prev, categoryId: data.category.id, category: data.category.name }));
        setNewCategoryVal('');
        setIsNewCategory(false);
        Swal.fire('Created!', 'Category created and selected.', 'success');
      } else {
        Swal.fire('Error', data.error || 'Failed to create category', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'API error', 'error');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagVal.trim()) return;
    try {
      const slug = newTagVal.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const res = await fetch('/api/blogs/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagVal, slug, projectId })
      });
      const data = await res.json();
      if (res.ok) {
        setTagsList(prev => [...prev, data.tag]);
        setFormData(prev => ({ ...prev, tags: [...prev.tags, data.tag.id] }));
        setNewTagVal('');
        setIsNewTag(false);
        Swal.fire('Created!', 'Tag created and selected.', 'success');
      } else {
        Swal.fire('Error', data.error || 'Failed to create tag', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'API error', 'error');
    }
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

      const finalHtml = editorMode === 'block' ? blocksToHtml(blocksValueRef.current) : formData.content;

      const submitData = {
        ...formData,
        content: finalHtml,
        slug,
        projectId,
        publishedAt: formData.publishedAt || null,
        scheduledAt: formData.scheduledAt || null,
      };

      if (editingBlog) {
        await blogsApi.update(editingBlog.id, submitData);
        Swal.fire('Success', 'Article updated successfully!', 'success');
      } else {
        await blogsApi.create(submitData);
        Swal.fire('Success', 'Article created successfully!', 'success');
      }
      await loadBlogs(projectId);
      closeModal();
    } catch (err) {
      setError(err.message);
      Swal.fire('Error', err.message, 'error');
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
      categoryId: blog.categoryId || (categories.find(c => c.name.toLowerCase() === blog.category?.toLowerCase())?.id || ''),
      featuredImage: blog.featuredImage || '',
      author: blog.author || '',
      authorId: blog.authorId || '',
      status: blog.status || 'draft',
      publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().split('T')[0] : '',
      scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt).toISOString().split('T')[0] : '',
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
      targetPages: targeted || [],
      tags: blog.tags ? blog.tags.map(t => t.id) : [],
    });

    const initialBlocks = htmlToBlocks(blog.content || '');
    setBlocksValue(initialBlocks);
    setEditorMode('block');

    setIsNewCategory(false);
    setNewCategoryVal('');
    setIsNewTag(false);
    setNewTagVal('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this article!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });

    if (res.isConfirmed) {
      try {
        await blogsApi.delete(id);
        Swal.fire('Deleted!', 'Article has been deleted.', 'success');
        await loadBlogs(projectId);
      } catch (err) {
        setError(err.message);
      }
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
      categoryId: '',
      featuredImage: '',
      author: '',
      authorId: '',
      status: 'draft',
      publishedAt: '',
      scheduledAt: '',
      seoTitle: '',
      seoDescription: '',
      targetPages: [],
      tags: [],
    });
    setBlocksValue([]);
    setEditorMode('block');
    setIsNewCategory(false);
    setNewCategoryVal('');
    setIsNewTag(false);
    setNewTagVal('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-draft',
      published: 'badge-published',
      scheduled: 'badge-scheduled',
    };
    return badges[status] || 'badge-draft';
  };

  const toggleTagSelection = (tagId) => {
    setFormData(prev => {
      const exists = prev.tags.includes(tagId);
      const updated = exists 
        ? prev.tags.filter(id => id !== tagId) 
        : [...prev.tags, tagId];
      return { ...prev, tags: updated };
    });
  };

  return (
    <div className="blog-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(to right, #4f46e5, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Articles & Blogs
          </h1>
          {projects.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'gray' }}>Active Website:</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #ccc)',
                  background: 'var(--bg-card, #fff)',
                  color: 'var(--text-primary)',
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
          <div style={{ display: 'flex', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', overflow: 'hidden' }}>
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
          <p>No articles found. Create your first blog post to get started!</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Tags</th>
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
                    {blog.featuredImage && (
                      <div className="thumbnail-preview">
                        <img src={blog.featuredImage} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      </div>
                    )}
                  </td>
                  <td>{blog.blogCategory?.name || blog.category || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {blog.tags && blog.tags.map(t => (
                        <span key={t.id} style={{ fontSize: '0.7rem', background: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(blog.status)}`}>{blog.status}</span>
                  </td>
                  <td>{blog.authorUser?.name || blog.author || '-'}</td>
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
              background: 'var(--bg-card, #fff)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: 'var(--text-primary)'
            }}>
              <div>
                {blog.featuredImage ? (
                  <img src={blog.featuredImage} alt={blog.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '160px', background: 'var(--bg-base, #f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                    No Image
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase' }}>
                      {blog.blogCategory?.name || blog.category || 'Uncategorized'}
                    </span>
                    <span className={`badge ${getStatusBadge(blog.status)}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{blog.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {blog.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {blog.excerpt || (blog.content && blog.content.replace(/<[^>]*>/g, '').slice(0, 120)) || 'No description available...'}
                  </p>
                  
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {blog.tags && blog.tags.map(t => (
                      <span key={t.id} style={{ fontSize: '0.65rem', background: '#f3e8ff', color: '#6b21a8', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color, #f3f4f6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base, #fafafa)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>By {blog.authorUser?.name || blog.author || 'Admin'}</span>
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
              <h2>{editingBlog ? '✏️ Edit Article' : '✨ New Article'}</h2>
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
                {/* Category Selection */}
                <div className="form-group">
                  <label>Category</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={isNewCategory ? 'NEW' : formData.categoryId}
                      onChange={(e) => {
                        if (e.target.value === 'NEW') {
                          setIsNewCategory(true);
                          setFormData({ ...formData, categoryId: '', category: '' });
                        } else {
                          setIsNewCategory(false);
                          const selectedCat = categories.find(c => c.id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            categoryId: e.target.value,
                            category: selectedCat ? selectedCat.name : '' 
                          });
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="NEW">+ Add Quick Category...</option>
                    </select>
                  </div>
                  {isNewCategory && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Type new category..."
                        value={newCategoryVal}
                        onChange={(e) => setNewCategoryVal(e.target.value)}
                      />
                      <button type="button" onClick={handleCreateCategory} className="btn-sm" style={{ whiteSpace: 'nowrap' }}>Save</button>
                    </div>
                  )}
                </div>

                {/* Author Selection */}
                <div className="form-group">
                  <label>Author</label>
                  <select
                    value={formData.authorId}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      setFormData({
                        ...formData,
                        authorId: e.target.value,
                        author: selectedUser ? selectedUser.name : ''
                      });
                    }}
                  >
                    <option value="">-- Select Author --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Selector */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Tags</span>
                  <button type="button" onClick={() => setIsNewTag(!isNewTag)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    {isNewTag ? 'Cancel' : '+ Add Quick Tag'}
                  </button>
                </label>
                
                {isNewTag && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Type new tag..."
                      value={newTagVal}
                      onChange={(e) => setNewTagVal(e.target.value)}
                    />
                    <button type="button" onClick={handleCreateTag} className="btn-sm" style={{ whiteSpace: 'nowrap' }}>Save Tag</button>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color, #ccc)',
                  borderRadius: '6px',
                  background: 'var(--bg-base, #fafafa)',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {tagsList.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>No tags available. Quick-create tag above!</span>
                  ) : (
                    tagsList.map(tag => {
                      const isSelected = formData.tags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTagSelection(tag.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid #7c3aed' : '1px solid var(--border-color, #ccc)',
                            background: isSelected ? '#f3e8ff' : '#fff',
                            color: isSelected ? '#6b21a8' : '#374151',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            fontWeight: isSelected ? 600 : 400
                          }}
                        >
                          # {tag.name}
                        </button>
                      );
                    })
                  )}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Content *</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editorMode === 'block') {
                        const html = blocksToHtml(blocksValue);
                        setFormData(prev => ({ ...prev, content: html }));
                        setEditorMode('classic');
                      } else {
                        const blocks = htmlToBlocks(formData.content);
                        setBlocksValue(blocks);
                        setEditorMode('block');
                      }
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid #6366f1',
                      color: '#6366f1',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {editorMode === 'block' ? '🔄 Switch to Classic Editor' : '🔄 Switch to Block Editor'}
                  </button>
                </div>

                {editorMode === 'block' ? (
                  <BlockEditor
                    value={blocksValue}
                    onChange={(newBlocks) => setBlocksValue(newBlocks)}
                  />
                ) : (
                  <JoditEditor
                    value={formData.content}
                    config={{
                      readonly: false,
                      placeholder: 'Start writing your blog content...',
                      height: 400,
                      theme: 'default',
                      style: {
                        color: '#000000',
                        background: '#ffffff'
                      }
                    }}
                    onBlur={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
                  />
                )}
              </div>

              {/* Featured Image Selector */}
              <div className="form-group">
                <label>Featured Image</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="https://... or select image"
                    style={{ flex: 1 }}
                  />
                  
                  <button
                    type="button"
                    className="btn-sm"
                    style={{ height: '40px', display: 'flex', alignItems: 'center', background: '#3b82f6', color: '#fff', border: 'none' }}
                    onClick={() => setShowMediaModal(true)}
                  >
                    🎬 Choose Media
                  </button>

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
                    {imageUploading ? 'Uploading...' : '📁 Upload File'}
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
                    disabled={formData.status === 'scheduled'}
                  />
                </div>
                
                <div className="form-group">
                  <label>Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    disabled={formData.status !== 'scheduled'}
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
                  border: '1px solid var(--border-color, #ccc)',
                  borderRadius: '4px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  background: 'var(--bg-card, #fff)',
                  color: 'var(--text-primary)'
                }}>
                  {availablePages.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: '#666666' }}>No pages registered for this project.</span>
                  ) : (
                    availablePages.map(p => {
                      const pagePath = p.slug.startsWith('/') ? p.slug : `/${p.slug}`;
                      const isChecked = formData.targetPages.includes(pagePath);
                      return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
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

      {/* Media Library Dialog */}
      {showMediaModal && (
        <div className="modal-overlay" onClick={() => setShowMediaModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>🎬 Select from Media Library</h2>
              <button onClick={() => setShowMediaModal(false)} className="modal-close">×</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {mediaList.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
                  No media library items found. Upload one first using the "Upload File" option!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                  {mediaList.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, featuredImage: m.url }));
                        setShowMediaModal(false);
                      }}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#fff',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <img src={m.url} alt={m.altText || m.filename} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                      <div style={{ padding: '0.4rem', fontSize: '0.72rem', color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {m.filename}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}