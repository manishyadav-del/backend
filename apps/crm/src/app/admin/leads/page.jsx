'use client';

import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/api.js';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Details Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    notificationEmail: 'ahealthplace@gmail.com',
    autoReplyEnabled: true,
    autoReplySubject: 'Thank you for contacting us',
    autoReplyBody: 'We have received your request and will reach out shortly.',
    spamProtectionEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    loadLeads();
    loadSettings();
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

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/leads/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('Failed to load lead settings:', e);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/leads/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Settings saved successfully!');
        setShowSettingsModal(false);
      }
    } catch {
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleView = (lead) => {
    setSelectedLead(lead);
    setNoteText(lead.notes || '');
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

  const handleSaveNote = async () => {
    if (!selectedLead) return;
    setSavingNote(true);
    try {
      await leadsApi.update(selectedLead.id, { notes: noteText });
      setSelectedLead(prev => prev ? { ...prev, notes: noteText } : null);
      await loadLeads();
      alert('Note saved!');
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setSavingNote(false);
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
    setNoteText('');
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Lead Submissions</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowSettingsModal(true)} className="btn-secondary">
            ⚙️ Settings
          </button>
          <a href={`/api/leads/export?projectId=${projectId}`} className="btn-primary" download style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
            Export CSV
          </a>
        </div>
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
                <th>Interest</th>
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
                        style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid #ccc' }}
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

      {/* LEAD DETAILS & INTERACTIVE NOTES MODAL */}
      {showDetailsModal && selectedLead && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lead Details</h2>
              <button onClick={closeDetailsModal} className="modal-close">×</button>
            </div>
            <div className="form-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1.5rem' }}>
              <div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Name:</strong> {selectedLead.name || 'Anonymous'}
                </div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Email:</strong> {selectedLead.email || '-'}
                </div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Phone:</strong> {selectedLead.phone || '-'}
                </div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Service Interest:</strong> {selectedLead.serviceInterest || '-'}
                </div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Source Page:</strong> {selectedLead.sourcePage || '-'}
                </div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Status:</strong> <span className={`badge ${getStatusBadge(selectedLead.status)}`}>{selectedLead.status}</span>
                </div>
                <div className="detail-row" style={{ marginBottom: '1rem' }}>
                  <strong>Date Received:</strong> {new Date(selectedLead.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Interactive Notes Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Internal Notes</strong>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write status notes or comments here..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeDetailsModal} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD CONFIGURATION SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Forms Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSaveSettings} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Change Notification Email */}
              <div className="form-group">
                <label>Change Notification Email</label>
                <input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                  placeholder="e.g. notifications@myclinic.com"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'gray', marginTop: '0.25rem', display: 'block' }}>
                  The email address where new form submissions and leads notifications are forwarded.
                </span>
              </div>

              {/* Auto Reply Setup */}
              <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Auto Reply Setup</strong>
                  <label className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.autoReplyEnabled}
                      onChange={(e) => setSettings({ ...settings, autoReplyEnabled: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>Enable Auto-Reply</span>
                  </label>
                </div>
                {settings.autoReplyEnabled && (<>
                  <div className="form-group">
                    <label>Auto-Reply Subject</label>
                    <input
                      type="text"
                      value={settings.autoReplySubject}
                      onChange={(e) => setSettings({ ...settings, autoReplySubject: e.target.value })}
                      placeholder="e.g. Thanks for reaching out!"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Auto-Reply Email Body</label>
                    <textarea
                      value={settings.autoReplyBody}
                      onChange={(e) => setSettings({ ...settings, autoReplyBody: e.target.value })}
                      placeholder="Write your email auto-reply response template..."
                      rows={4}
                      required
                    />
                  </div>
                </>)}
              </div>

              {/* Spam Protection */}
              <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Spam Protection</strong>
                  <span style={{ fontSize: '0.75rem', color: 'gray' }}>Enable Honeypot fields and bot submission filtering.</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.spamProtectionEnabled}
                    onChange={(e) => setSettings({ ...settings, spamProtectionEnabled: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Protected</span>
                </label>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #eee', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={savingSettings} className="btn-primary">
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}