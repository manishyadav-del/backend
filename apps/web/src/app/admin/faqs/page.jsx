'use client';

import { useEffect, useState } from 'react';
import { faqsApi } from '@/lib/api.js';

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [pages, setPages] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    sortOrder: 0,
    isVisible: true,
    projectId: 'demo',
    pageId: null,
    serviceId: null,
  });

  const projectId = 'demo';

  useEffect(() => {
    loadFaqs();
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [pagesRes, servicesRes] = await Promise.all([
        fetch(`/api/pages?projectId=${projectId}`),
        fetch(`/api/services?projectId=${projectId}`)
      ]);
      const pagesData = await pagesRes.json();
      const servicesData = await servicesRes.json();
      setPages(pagesData.pages || []);
      setServices(servicesData.services || []);
    } catch (e) {
      console.error('Failed to load metadata:', e);
    }
  };

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const data = await faqsApi.getAll(projectId);
      setFaqs(data.faqs || []);
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
      if (editingFaq) {
        await faqsApi.update(editingFaq.id, formData);
      } else {
        await faqsApi.create({ ...formData, projectId });
      }
      await loadFaqs();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      sortOrder: faq.sortOrder || 0,
      isVisible: faq.isVisible ?? true,
      projectId: faq.projectId || 'demo',
      pageId: faq.pageId || null,
      serviceId: faq.serviceId || null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await faqsApi.delete(id);
      await loadFaqs();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      sortOrder: 0,
      isVisible: true,
      projectId: 'demo',
      pageId: null,
      serviceId: null,
    });
  };

  return (
    <div className="faqs-page">
      <div className="page-header">
        <h1>FAQs</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New FAQ</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="empty-state">
          <p>No FAQs yet. Add your first FAQ to get started.</p>
        </div>
      ) : (
        <div className="faqs-list">
          {faqs.map(faq => (
            <div key={faq.id} className="faq-item">
              <div className="faq-question">
                <strong>Q:</strong> {faq.question}
              </div>
              <div className="faq-answer">
                <strong>A:</strong> {faq.answer}
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(faq)} className="btn-sm">Edit</button>
                <button onClick={() => handleDelete(faq.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFaq ? 'Edit FAQ' : 'New FAQ'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Answer *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign to Page</label>
                  <select
                    value={formData.pageId || ''}
                    onChange={(e) => setFormData({ ...formData, pageId: e.target.value || null })}
                  >
                    <option value="">None (Global FAQ)</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign to Service</label>
                  <select
                    value={formData.serviceId || ''}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
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
                <button type="submit" className="btn-primary">{editingFaq ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}