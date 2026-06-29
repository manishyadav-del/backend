'use client';

import { useEffect, useState } from 'react';
import { contactsApi } from '@/lib/api.js';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Projects list for dropdown selector
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('default');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    type: 'email',
    label: '',
    value: '',
    icon: '',
    sortOrder: 0,
  });

  // Load all projects first
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          // Set first project as active
          setProjectId(data.projects[0].id);
        }
      })
      .catch(err => console.error('Failed to load projects:', err));
  }, []);

  // Reload contacts when projectId changes
  useEffect(() => {
    loadContacts();
  }, [projectId]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsApi.getAll(projectId);
      setContacts(data.contacts || []);
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
      if (editingContact) {
        await contactsApi.update(editingContact.id, formData);
      } else {
        await contactsApi.create({ ...formData, projectId });
      }
      await loadContacts();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      type: contact.type || 'email',
      label: contact.label || '',
      value: contact.value || '',
      icon: contact.icon || '',
      sortOrder: contact.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact detail?')) return;
    try {
      await contactsApi.delete(id);
      await loadContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = (value, id) => {
    navigator.clipboard.writeText(value)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(err => console.error('Failed to copy contact:', err));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      type: 'email',
      label: '',
      value: '',
      icon: '',
      sortOrder: 0,
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      email: '📧',
      phone: '📞',
      address: '📍',
      whatsapp: '💬',
      maps: '🗺️',
      hours: '🕐',
      social: '🌐',
    };
    return icons[type] || '📌';
  };

  const getTypeBadgeStyles = (type) => {
    const styles = {
      email: { background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)' },
      phone: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' },
      whatsapp: { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' },
      address: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' },
      maps: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' },
      hours: { background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' },
      social: { background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' },
    };
    return styles[type] || { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' };
  };

  const filteredContacts = contacts.filter(c => 
    c.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.label && c.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="contacts-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Contact Details</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage contact channels, maps, hours, and social media links.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project:</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Contact</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Filter / Search Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          placeholder="Search contacts by label, value, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading contact details...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="empty-state" style={{
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '3rem' }}>📞</span>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-h1)' }}>No contact details found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px' }}>
            {searchQuery ? 'No items match your search filter.' : 'Add phone numbers, email addresses, WhatsApp, office coordinates, and social handles to show them here.'}
          </p>
        </div>
      ) : (
        <div className="contacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredContacts.map(contact => {
            const badge = getTypeBadgeStyles(contact.type);
            return (
              <div 
                key={contact.id} 
                className="contact-card"
                style={{
                  background: 'var(--gradient-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  transition: 'var(--transition)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    ...badge
                  }}>
                    <span>{getTypeIcon(contact.type)}</span>
                    <span>{contact.type}</span>
                  </div>
                  
                  {contact.sortOrder !== undefined && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      Order: {contact.sortOrder}
                    </span>
                  )}
                </div>

                <div className="contact-info" style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {contact.label || `${contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}`}
                  </h4>
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-h1)', wordBreak: 'break-all' }}>
                    {contact.value}
                  </p>
                </div>

                <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    onClick={() => handleCopy(contact.value, contact.id)} 
                    className="btn-sm" 
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <span>{copiedId === contact.id ? '✓' : '📋'}</span>
                    <span>{copiedId === contact.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button onClick={() => handleEdit(contact)} className="btn-sm" style={{ flex: 1 }}>Edit</button>
                  <button onClick={() => handleDelete(contact.id)} className="btn-sm btn-danger" style={{ flex: 1 }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>{editingContact ? 'Edit Contact Detail' : 'Add Contact Detail'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              
              <div className="form-group">
                <label>Contact Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                  <option value="address">Physical Address</option>
                  <option value="whatsapp">WhatsApp Number</option>
                  <option value="maps">Google Maps Coordinates / URL</option>
                  <option value="hours">Business Hours</option>
                  <option value="social">Social Media Handle / Link</option>
                </select>
              </div>

              <div className="form-group">
                <label>Custom Label / Title</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Sales Inquiries, Support Hotline, Head Office"
                />
              </div>

              <div className="form-group">
                <label>Contact Value *</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  placeholder={
                    formData.type === 'email' ? 'e.g. hello@gobal.com' :
                    formData.type === 'phone' ? 'e.g. +1 (555) 987-6543' :
                    formData.type === 'whatsapp' ? 'e.g. +1 (555) 987-6543' :
                    formData.type === 'address' ? 'e.g. 100 Innovation Way, Suite 400' :
                    formData.type === 'hours' ? 'e.g. Mon-Fri: 9 AM - 6 PM' :
                    'Enter detail value...'
                  }
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label>Custom Icon Class (Optional)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g. fa-facebook, ri-mail"
                  />
                </div>
                <div>
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', background: 'none', padding: '0' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingContact ? 'Save Changes' : 'Add Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}