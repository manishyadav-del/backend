'use client';

import { useEffect, useState } from 'react';
import { testimonialsApi } from '@/lib/api.js';
import WebsiteAssignmentTab from '@/components/WebsiteAssignmentTab.jsx';

export default function TestimonialsPage() {
  const [activeTab, setActiveTab] = useState('list'); // list, assignments
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    clientImage: '',
    rating: 5,
    content: '',
    isVisible: true,
    sortOrder: 0,
  });

  const projectId = 'demo';

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialsApi.getAll(projectId);
      setTestimonials(data.testimonials || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        await testimonialsApi.update(editingTestimonial.id, formData);
      } else {
        await testimonialsApi.create({ ...formData, projectId });
      }
      await loadTestimonials();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      clientName: testimonial.clientName || '',
      clientImage: testimonial.clientImage || '',
      rating: testimonial.rating || 5,
      content: testimonial.content || '',
      isVisible: testimonial.isVisible ?? true,
      sortOrder: testimonial.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await testimonialsApi.delete(id);
      await loadTestimonials();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTestimonial(null);
    setFormData({
      clientName: '',
      clientImage: '',
      rating: 5,
      content: '',
      isVisible: true,
      sortOrder: 0,
    });
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="testimonials-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Testimonials</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage client reviews, testimonial details, and reputation module mappings.
          </p>
        </div>
        {activeTab === 'list' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ New Testimonial</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'list' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Testimonials List
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'assignments' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Website Assignment
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'list' && (
        <>
          {loading ? (
        <div className="loading">Loading testimonials...</div>
      ) : testimonials.length === 0 ? (
        <div className="empty-state">
          <p>No testimonials yet. Add your first testimonial to get started.</p>
        </div>
      ) : (
        <div className="testimonials-grid">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-header">
                {testimonial.clientImage && (
                  <img src={testimonial.clientImage} alt={testimonial.clientName} className="testimonial-avatar" />
                )}
                <div className="testimonial-info">
                  <h4>{testimonial.clientName}</h4>
                  <div className="testimonial-rating">{renderStars(testimonial.rating)}</div>
                </div>
              </div>
              <p className="testimonial-content">{testimonial.content}</p>
              <div className="card-actions">
                <button onClick={() => handleEdit(testimonial)} className="btn-sm">Edit</button>
                <button onClick={() => handleDelete(testimonial.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {activeTab === 'assignments' && (
        <WebsiteAssignmentTab moduleKey="reputation" />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTestimonial ? 'Edit Testimonial' : 'New Testimonial'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Client Image URL</label>
                <input
                  type="url"
                  value={formData.clientImage}
                  onChange={(e) => setFormData({ ...formData, clientImage: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              <div className="form-group">
                <label>Testimonial Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="5"
                  required
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
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  />
                  Visible
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingTestimonial ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}