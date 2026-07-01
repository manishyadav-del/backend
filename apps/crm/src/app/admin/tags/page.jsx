'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function TagsPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
        setError('Failed to load projects');
      });
  }, []);

  useEffect(() => {
    if (projectId) {
      loadTags();
    } else {
      setTags([]);
      setLoading(false);
    }
  }, [projectId]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blogs/tags?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setTags(data.tags || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load tags');
      }
    } catch (err) {
      setError('Error connecting to tags API');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val) => {
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: isEditing ? prev.slug : slugified
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      Swal.fire('Error', 'Name and Slug are required', 'error');
      return;
    }

    try {
      if (isEditing) {
        const res = await fetch(`/api/blogs/tags/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire('Success', 'Tag updated successfully', 'success');
          resetForm();
          loadTags();
        } else {
          Swal.fire('Error', data.error || 'Failed to update tag', 'error');
        }
      } else {
        const res = await fetch('/api/blogs/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, projectId })
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire('Success', 'Tag created successfully', 'success');
          resetForm();
          loadTags();
        } else {
          Swal.fire('Error', data.error || 'Failed to create tag', 'error');
        }
      }
    } catch (err) {
      Swal.fire('Error', 'API submission error', 'error');
    }
  };

  const handleEdit = (tag) => {
    setIsEditing(true);
    setEditingId(tag.id);
    setFormData({
      name: tag.name,
      slug: tag.slug
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the tag! Blogs containing this tag will no longer show it.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/blogs/tags/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Deleted!', 'Tag has been deleted.', 'success');
          loadTags();
        } else {
          Swal.fire('Error', 'Failed to delete tag', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'API deletion error', 'error');
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', slug: '' });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(to right, #8b5cf6, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.5rem 0' }}>
            Tags Management
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage metadata keywords and tags for flexible categorization.
          </p>
        </div>
        
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Select Website/Project:</label>
          <select 
            value={projectId} 
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #e5e7eb)',
              background: 'var(--bg-card, #fff)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Form Column */}
        <div style={{
          background: 'var(--bg-card, #fff)',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #e5e7eb)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          height: 'fit-content'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 600, fontSize: '1.1rem' }}>
            {isEditing ? '✏️ Edit Tag' : '🏷️ Add New Tag'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Name</label>
              <input
                type="text"
                placeholder="e.g. Heart Health"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  background: 'var(--bg-input, #fff)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.85rem' }}>Slug</label>
              <input
                type="text"
                placeholder="heart-health"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  background: 'var(--bg-input, #fff)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>
                {isEditing ? 'Update Tag' : 'Create Tag'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1rem', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Column */}
        <div style={{
          background: 'var(--bg-card, #fff)',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #e5e7eb)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          {loading ? (
            <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Loading tags...</div>
          ) : tags.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <p>No tags found for this website. Create one on the left!</p>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map(tag => (
                    <tr key={tag.id}>
                      <td>
                        <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                          # {tag.name}
                        </span>
                      </td>
                      <td><code style={{ fontSize: '0.85rem', background: 'var(--bg-base, #f3f4f6)', padding: '0.15rem 0.3rem', borderRadius: '4px' }}>{tag.slug}</code></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(tag)} className="btn-sm" style={{ padding: '0.25rem 0.5rem' }}>Edit</button>
                          <button onClick={() => handleDelete(tag.id)} className="btn-sm btn-danger" style={{ padding: '0.25rem 0.5rem' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
