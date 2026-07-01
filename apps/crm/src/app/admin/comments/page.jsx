'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function CommentsPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

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
      loadComments();
    } else {
      setComments([]);
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  const loadComments = async () => {
    try {
      setLoading(true);
      let url = `/api/comments?projectId=${projectId}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Error connecting to comments API');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        Swal.fire('Success', `Comment status updated to ${newStatus}`, 'success');
        loadComments();
      } else {
        Swal.fire('Error', 'Failed to update status', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'API error', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This comment will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Deleted!', 'Comment has been deleted.', 'success');
          loadComments();
        } else {
          Swal.fire('Error', 'Failed to delete comment', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'API error', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { bg: '#d1fae5', color: '#065f46', label: 'Approved' };
      case 'spam': return { bg: '#fee2e2', color: '#991b1b', label: 'Spam' };
      case 'trash': return { bg: '#f3f4f6', color: '#374151', label: 'Trash' };
      default: return { bg: '#fef3c7', color: '#92400e', label: 'Pending' };
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(to right, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.5rem 0' }}>
            Comments Moderation
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Moderate visitor and reader feedback on published articles.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--bg-card, #fff)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="">All Comments</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="spam">Spam</option>
              <option value="trash">Trash</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Project:</label>
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
      </div>

      <div style={{
        background: 'var(--bg-card, #fff)',
        padding: '1.5rem',
        borderRadius: '10px',
        border: '1px solid var(--border-color, #e5e7eb)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        
        {loading ? (
          <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <p>No comments found matching the filters.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Comment / Content</th>
                  <th>Article</th>
                  <th>Status</th>
                  <th style={{ width: '220px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map(c => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.authorName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.authorEmail}</div>
                      </td>
                      <td style={{ maxWidth: '400px' }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>{c.content}</p>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          Posted on {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {c.blog?.title || 'Unknown Post'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {c.status !== 'approved' && (
                            <button onClick={() => handleUpdateStatus(c.id, 'approved')} className="btn-sm" style={{ padding: '0.25rem 0.5rem', background: '#10b981', color: '#fff', border: 'none' }}>
                              Approve
                            </button>
                          )}
                          {c.status !== 'spam' && (
                            <button onClick={() => handleUpdateStatus(c.id, 'spam')} className="btn-sm" style={{ padding: '0.25rem 0.5rem', background: '#f59e0b', color: '#fff', border: 'none' }}>
                              Spam
                            </button>
                          )}
                          <button onClick={() => handleDelete(c.id)} className="btn-sm btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
