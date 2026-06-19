'use client';

import { useEffect, useState } from 'react';
import { contactsApi } from '@/lib/api.js';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    type: 'email',
    label: '',
    value: '',
    icon: '',
    sortOrder: 0,
  });

  const projectId = 'demo';

  useEffect(() => {
    loadContacts();
  }, []);

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
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await contactsApi.delete(id);
      await loadContacts();
    } catch (err) {
      setError(err.message);
    }
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

  return (
    <div className="contacts-page">
      <div className="page-header">
        <h1>Contact Details</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Contact</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="empty-state">
          <p>No contact details yet. Add your first contact to get started.</p>
        </div>
      ) : (
        <div className="contacts-grid">
          {contacts.map(contact => (
            <div key={contact.id} className="contact-card">
              <div className="contact-icon">{getTypeIcon(contact.type)}</div>
              <div className="contact-info">
                <h4>{contact.label || contact.type}</h4>
                <p>{contact.value}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(contact)} className="btn-sm">Edit</button>
                <button onClick={() => handleDelete(contact.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="address">Address</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="maps">Maps</option>
                  <option value="hours">Business Hours</option>
                  <option value="social">Social Media</option>
                </select>
              </div>
              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Main Office"
                />
              </div>
              <div className="form-group">
                <label>Value *</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  placeholder="e.g., info@example.com"
                />
              </div>
              <div className="form-group">
                <label>Icon (optional)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Icon name or URL"
                />
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingContact ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}