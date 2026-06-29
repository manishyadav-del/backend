'use client';

import { useEffect, useState, useCallback } from 'react';

const PROJECT_ID = 'default';

const EMPTY_CTA = { title: '', buttonText: '', link: '', type: 'button', placement: 'global', isActive: true, sortOrder: 0, bgColor: '', textColor: '' };
const EMPTY_POPUP = { title: '', content: '', type: 'info', trigger: 'exit', delay: 5, isActive: true, buttonText: '', buttonLink: '', image: '' };

export default function CTAPage() {
  const [tab, setTab] = useState('ctas');
  const [ctas, setCtas] = useState([]);
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CTA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCtas = useCallback(async () => {
    const res = await fetch(`/api/cta?projectId=${PROJECT_ID}`);
    const data = await res.json();
    setCtas(data.ctas || []);
  }, []);

  const loadPopups = useCallback(async () => {
    const res = await fetch(`/api/popups?projectId=${PROJECT_ID}`);
    const data = await res.json();
    setPopups(data.popups || []);
  }, []);

  useEffect(() => {
    Promise.all([loadCtas(), loadPopups()]).finally(() => setLoading(false));
  }, [loadCtas, loadPopups]);

  const openAdd = () => {
    setEditing(null);
    setForm(tab === 'ctas' ? EMPTY_CTA : EMPTY_POPUP);
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const isCta = tab === 'ctas';
    const endpoint = isCta ? '/api/cta' : '/api/popups';
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${endpoint}/${editing.id}` : endpoint;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? form : { ...form, projectId: PROJECT_ID }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }

      setShowModal(false);
      setMessage('Saved successfully');
      setTimeout(() => setMessage(''), 3000);
      if (isCta) loadCtas(); else loadPopups();
    } catch { setError('Something went wrong'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    const isCta = tab === 'ctas';
    await fetch(`${isCta ? '/api/cta' : '/api/popups'}/${id}`, { method: 'DELETE' });
    if (isCta) loadCtas(); else loadPopups();
  };

  const currentItems = tab === 'ctas' ? ctas : popups;

  return (
    <div className="cta-page">
      <div className="page-header">
        <h1>CTA / Lead Capture</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add {tab === 'ctas' ? 'CTA' : 'Popup'}</button>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="tab-nav" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {['ctas', 'popups'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
              fontSize: '0.9rem', fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'ctas' ? '🔘 CTAs & Buttons' : '💬 Popups'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : currentItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab === 'ctas' ? '🔘' : '💬'}</div>
          <div className="empty-title">No {tab === 'ctas' ? 'CTAs' : 'Popups'} yet</div>
          <div className="empty-desc">Click &quot;+ Add&quot; to create your first one.</div>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>{tab === 'ctas' ? 'Type' : 'Type'}</th>
              <th>{tab === 'ctas' ? 'Placement' : 'Trigger'}</th>
              <th>{tab === 'ctas' ? 'Link' : 'Button'}</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td><span className="badge badge-draft">{item.type}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {tab === 'ctas' ? item.placement : item.trigger}
                  {tab === 'popups' && item.delay && ` (${item.delay}s)`}
                </td>
                <td><code style={{ fontSize: '0.8125rem' }}>{tab === 'ctas' ? (item.link || '—') : (item.buttonLink || '—')}</code></td>
                <td>
                  <span className={`badge ${item.isActive ? 'badge-published' : 'badge-archived'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn-sm" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit' : 'Add'} {tab === 'ctas' ? 'CTA' : 'Popup'}</h2>
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              {tab === 'ctas' ? (
                <>
                  <div className="form-group">
                    <label>Button Text</label>
                    <input type="text" value={form.buttonText || ''} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Link URL</label>
                    <input type="text" value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={form.type || 'button'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        <option value="button">Button</option>
                        <option value="floating">Floating Button</option>
                        <option value="banner">Banner</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Placement</label>
                      <select value={form.placement || 'global'} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                        <option value="global">Global</option>
                        <option value="homepage">Homepage</option>
                        <option value="all">All Pages</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Background Color</label>
                      <input type="text" value={form.bgColor || ''} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} placeholder="#0ea5e9" />
                    </div>
                    <div className="form-group">
                      <label>Text Color</label>
                      <input type="text" value={form.textColor || ''} onChange={(e) => setForm({ ...form, textColor: e.target.value })} placeholder="#ffffff" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input type="number" value={form.sortOrder || 0} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Content</label>
                    <textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={form.type || 'info'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        <option value="info">Info</option>
                        <option value="newsletter">Newsletter</option>
                        <option value="lead-magnet">Lead Magnet</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Trigger</label>
                      <select value={form.trigger || 'exit'} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>
                        <option value="exit">Exit Intent</option>
                        <option value="time">Time Delay</option>
                        <option value="scroll">On Scroll</option>
                        <option value="click">On Click</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Delay (seconds)</label>
                    <input type="number" value={form.delay || 5} onChange={(e) => setForm({ ...form, delay: parseInt(e.target.value) })} min={1} />
                  </div>
                  <div className="form-group">
                    <label>Button Text</label>
                    <input type="text" value={form.buttonText || ''} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Button Link</label>
                    <input type="text" value={form.buttonLink || ''} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} placeholder="https://..." />
                  </div>
                </>
              )}
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}