'use client';

import { useEffect, useState } from 'react';
import { redirectsApi } from '@/lib/api.js';

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState(null);
  const [formData, setFormData] = useState({
    fromPath: '',
    toPath: '',
    type: '301',
    isActive: true,
  });

  const projectId = 'demo';

  useEffect(() => {
    loadRedirects();
  }, []);

  async function loadRedirects() {
    try {
      setLoading(true);
      const data = await redirectsApi.getAll(projectId);
      setRedirects(data.redirects || []);
      setError(null);
    } catch (err) {
      setError('Failed to load redirects');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRedirect) {
        await redirectsApi.update(editingRedirect.id, formData);
      } else {
        await redirectsApi.create({ ...formData, projectId });
      }
      await loadRedirects();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (redirect) => {
    setEditingRedirect(redirect);
    setFormData({
      fromPath: redirect.fromPath || '',
      toPath: redirect.toPath || '',
      type: redirect.type || '301',
      isActive: redirect.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this redirect?')) return;
    try {
      await redirectsApi.delete(id);
      await loadRedirects();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRedirect(null);
    setFormData({ fromPath: '', toPath: '', type: '301', isActive: true });
  };

  return (
    <div className="redirects-page">
      <div className="page-header">
        <h1>404 & Redirects</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Redirect</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading redirects...</div>
      ) : redirects.length === 0 ? (
        <div className="empty-state">
          <p>No redirects yet. Create your first redirect to manage URL routing.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map(redir => (
              <tr key={redir.id}>
                <td><code>{redir.fromPath}</code></td>
                <td><code>{redir.toPath}</code></td>
                <td>{redir.type}</td>
                <td><span className={'badge badge-' + (redir.isActive ? 'published' : 'draft')}>{redir.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <button className="btn-sm" onClick={() => handleEdit(redir)}>Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(redir.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRedirect ? 'Edit Redirect' : 'New Redirect'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>From Path *</label>
                <input
                  type="text"
                  value={formData.fromPath}
                  onChange={(e) => setFormData({ ...formData, fromPath: e.target.value })}
                  placeholder="/old-page"
                  required
                />
              </div>
              <div className="form-group">
                <label>To Path *</label>
                <input
                  type="text"
                  value={formData.toPath}
                  onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
                  placeholder="/new-page"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Redirect Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="301">301 (Permanent)</option>
                    <option value="302">302 (Temporary)</option>
                  </select>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingRedirect ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}