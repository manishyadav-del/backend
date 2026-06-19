'use client';

import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/api.js';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsApi.getAll(projectId);
      setLeads(data.leads || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await leadsApi.update(id, { status });
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadsApi.delete(id);
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedLead(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'badge-new',
      contacted: 'badge-read',
      qualified: 'badge-published',
      converted: 'badge-success',
      lost: 'badge-spam',
    };
    return badges[status] || 'badge-new';
  };

  return (
    <div className="leads-page">
      <div className="page-header">
        <h1>Leads</h1>
        <a href={`/api/leads/export?projectId=${projectId}`} className="btn-primary" download style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
          Export CSV
        </a>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <p>No leads yet. Leads will appear here from form submissions and other sources.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Service Interest</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>{lead.name || 'Anonymous'}</td>
                  <td>{lead.email || '-'}</td>
                  <td>{lead.phone || '-'}</td>
                  <td>{lead.serviceInterest || '-'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(lead.status)}`}>{lead.status}</span>
                  </td>
                  <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleView(lead)} className="btn-sm">View</button>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                        className="btn-sm"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                      <button onClick={() => handleDelete(lead.id)} className="btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailsModal && selectedLead && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lead Details</h2>
              <button onClick={closeDetailsModal} className="modal-close">×</button>
            </div>
            <div className="form-details">
              <div className="detail-row">
                <strong>Name:</strong> {selectedLead.name || 'Anonymous'}
              </div>
              <div className="detail-row">
                <strong>Email:</strong> {selectedLead.email || '-'}
              </div>
              <div className="detail-row">
                <strong>Phone:</strong> {selectedLead.phone || '-'}
              </div>
              <div className="detail-row">
                <strong>Service Interest:</strong> {selectedLead.serviceInterest || '-'}
              </div>
              <div className="detail-row">
                <strong>Source:</strong> {selectedLead.source || '-'}
              </div>
              <div className="detail-row">
                <strong>Source Page:</strong> {selectedLead.sourcePage || '-'}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> {selectedLead.status}
              </div>
              <div className="detail-row">
                <strong>Date:</strong> {new Date(selectedLead.createdAt).toLocaleString()}
              </div>
              {selectedLead.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong>
                  <p>{selectedLead.notes}</p>
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