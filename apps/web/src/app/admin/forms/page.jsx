'use client';

import { useEffect, useState } from 'react';
import { formsApi } from '@/lib/api.js';

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await formsApi.getAll(projectId);
      setForms(data.formSubmissions || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (form) => {
    setSelectedForm(form);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await formsApi.update(id, { status });
      await loadForms();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this form submission?')) return;
    try {
      await formsApi.delete(id);
      await loadForms();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedForm(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'badge-new',
      read: 'badge-read',
      replied: 'badge-replied',
      spam: 'badge-spam',
    };
    return badges[status] || 'badge-new';
  };

  const getFormTypeLabel = (formType) => {
    const labels = {
      contact: 'Contact Form',
      feedback: 'Feedback Form',
      support: 'Support Request',
      quote: 'Quote Request',
    };
    return labels[formType] || formType;
  };

  return (
    <div className="forms-page">
      <div className="page-header">
        <h1>Form Submissions</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading form submissions...</div>
      ) : forms.length === 0 ? (
        <div className="empty-state">
          <p>No form submissions yet. Submissions will appear here when visitors fill out forms.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <tr key={form.id}>
                  <td>{form.name || 'Anonymous'}</td>
                  <td>{form.email || '-'}</td>
                  <td>{getFormTypeLabel(form.formType)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(form.status)}`}>{form.status}</span>
                  </td>
                  <td>{new Date(form.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleView(form)} className="btn-sm">View</button>
                      <select
                        value={form.status}
                        onChange={(e) => handleStatusUpdate(form.id, e.target.value)}
                        className="btn-sm"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="spam">Spam</option>
                      </select>
                      <button onClick={() => handleDelete(form.id)} className="btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailsModal && selectedForm && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Form Submission Details</h2>
              <button onClick={closeDetailsModal} className="modal-close">×</button>
            </div>
            <div className="form-details">
              <div className="detail-row">
                <strong>Name:</strong> {selectedForm.name || 'Anonymous'}
              </div>
              <div className="detail-row">
                <strong>Email:</strong> {selectedForm.email || '-'}
              </div>
              <div className="detail-row">
                <strong>Phone:</strong> {selectedForm.phone || '-'}
              </div>
              <div className="detail-row">
                <strong>Type:</strong> {getFormTypeLabel(selectedForm.formType)}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> {selectedForm.status}
              </div>
              <div className="detail-row">
                <strong>Date:</strong> {new Date(selectedForm.createdAt).toLocaleString()}
              </div>
              {selectedForm.message && (
                <div className="detail-row">
                  <strong>Message:</strong>
                  <p className="detail-message">{selectedForm.message}</p>
                </div>
              )}
              {selectedForm.data && (
                <div className="detail-row">
                  <strong>Additional Data:</strong>
                  <pre className="detail-json">{JSON.stringify(JSON.parse(selectedForm.data), null, 2)}</pre>
                </div>
              )}
              {selectedForm.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong>
                  <p>{selectedForm.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeDetailsModal} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}