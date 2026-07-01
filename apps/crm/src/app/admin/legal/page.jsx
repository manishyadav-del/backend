'use client';

import { useEffect, useState } from 'react';
import { legalApi } from '@/lib/api.js';

export default function LegalPage() {
  const [legalPages, setLegalPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    type: 'privacy',
    title: '',
    content: '',
  });

  const projectId = 'demo';

  useEffect(() => {
    loadLegalPages();
  }, []);

  const loadLegalPages = async () => {
    try {
      setLoading(true);
      const data = await legalApi.getAll(projectId);
      setLegalPages(data.pages || []);
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
      if (editingPage) {
        await legalApi.update(editingPage.id, formData);
      } else {
        await legalApi.create({ ...formData, projectId });
      }
      await loadLegalPages();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      type: page.type || 'privacy',
      title: page.title || '',
      content: page.content || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this legal page?')) return;
    try {
      await legalApi.delete(id);
      await loadLegalPages();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPage(null);
    setFormData({
      type: 'privacy',
      title: '',
      content: '',
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookies: 'Cookie Policy',
      disclaimer: 'Disclaimer',
      refund: 'Refund Policy',
    };
    return labels[type] || type;
  };

  return (
    <div className="legal-page">
      <div className="page-header">
        <h1>Legal Pages</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Legal Page</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading legal pages...</div>
      ) : legalPages.length === 0 ? (
        <div className="empty-state">
          <p>No legal pages yet. Add your first legal page to get started.</p>
        </div>
      ) : (
        <div className="legal-list">
          {legalPages.map(page => (
            <div key={page.id} className="legal-item">
              <div className="legal-info">
                <h4>{page.title}</h4>
                <span className="legal-type">{getTypeLabel(page.type)}</span>
                <p className="legal-date">Last updated: {new Date(page.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(page)} className="btn-sm">Edit</button>
                <button onClick={() => handleDelete(page.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPage ? 'Edit Legal Page' : 'New Legal Page'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="privacy">Privacy Policy</option>
                  <option value="terms">Terms of Service</option>
                  <option value="cookies">Cookie Policy</option>
                  <option value="disclaimer">Disclaimer</option>
                  <option value="refund">Refund Policy</option>
                </select>
              </div>
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
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="12"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingPage ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}