'use client';

import { useEffect, useState, useCallback } from 'react';
import { servicesApi } from '@/lib/api.js';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedFaqIds, setSelectedFaqIds] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    ctaText: '',
    ctaLink: '',
    sortOrder: 0,
    isVisible: true,
  });

  const projectId = 'demo';

  const loadServices = useCallback(async () => {
    try {
      const data = await servicesApi.getAll(projectId);
      setServices(data.services || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadFaqs = useCallback(async () => {
    try {
      const res = await fetch(`/api/faqs?projectId=${projectId}`);
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadServices(), loadFaqs()]).finally(() => setLoading(false));
  }, [loadServices, loadFaqs]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('projectId', projectId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Upload error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        projectId,
        faqIds: selectedFaqIds,
      };

      if (editingService) {
        await servicesApi.update(editingService.id, submitData);
      } else {
        await servicesApi.create(submitData);
      }
      await loadServices();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      image: service.image || '',
      ctaText: service.ctaText || '',
      ctaLink: service.ctaLink || '',
      sortOrder: service.sortOrder || 0,
      isVisible: service.isVisible ?? true,
    });

    // Fetch service detailed faqs
    try {
      const res = await fetch(`/api/services/${service.id}`);
      const data = await res.json();
      if (data.service && data.service.faqs) {
        setSelectedFaqIds(data.service.faqs.map(f => f.id));
      } else {
        setSelectedFaqIds([]);
      }
    } catch {
      setSelectedFaqIds([]);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await servicesApi.delete(id);
      await loadServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setSelectedFaqIds([]);
    setFormData({
      title: '',
      description: '',
      image: '',
      ctaText: '',
      ctaLink: '',
      sortOrder: 0,
      isVisible: true,
    });
  };

  const handleFaqToggle = (id) => {
    if (selectedFaqIds.includes(id)) {
      setSelectedFaqIds(selectedFaqIds.filter(fid => fid !== id));
    } else {
      setSelectedFaqIds([...selectedFaqIds, id]);
    }
  };

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Services</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Service</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <p>No services yet. Create your first service to get started.</p>
        </div>
      ) : (
        <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {services.map(service => (
            <div key={service.id} className="service-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-h1)', margin: 0 }}>{service.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineBreak: 'anywhere' }}>{service.description || 'No description provided.'}</p>
              {service.image && (
                <div style={{ height: '140px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={service.image} alt={service.title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleEdit(service)} className="btn-sm" style={{ flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(service.id)} className="btn-sm btn-danger" style={{ flex: 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
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
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Service Image</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... or upload image"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="file"
                    id="service-image-file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-sm"
                    style={{ height: '40px', display: 'flex', alignItems: 'center' }}
                    onClick={() => document.getElementById('service-image-file').click()}
                    disabled={imageUploading}
                  >
                    {imageUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="e.g. Learn More"
                  />
                </div>
                <div className="form-group">
                  <label>CTA Button Link</label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="e.g. /services/web"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group checkbox" style={{ marginTop: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    />
                    Visible
                  </label>
                </div>
              </div>

              {/* FAQ Assignment Checklist */}
              <div style={{ marginTop: '1.5rem', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-h1)', marginBottom: '0.75rem' }}>Assign FAQs to this Service</h3>
                {faqs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No FAQs available. Create them in FAQ section first.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {faqs.map(faq => (
                      <label key={faq.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedFaqIds.includes(faq.id)}
                          onChange={() => handleFaqToggle(faq.id)}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>Q:</strong> {faq.question}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', background: 'none', padding: '1rem 0 0' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={imageUploading}>
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}