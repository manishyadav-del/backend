'use client';

import { useEffect, useState } from 'react';
import { seoApi } from '@/lib/api.js';

export default function SEOPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSeo, setEditingSeo] = useState(null);
  const [formData, setFormData] = useState({
    metaTitle: '',
    metaDescription: '',
    urlSlug: '',
    canonical: '',
    ogImage: '',
    robots: '',
    llmTxt: '',
  });

  const projectId = 'demo'; // TODO: Get from context/auth

  useEffect(() => {
    loadSeoData();
  }, []);

  async function loadSeoData() {
    try {
      setLoading(true);
      const data = await seoApi.getAll(projectId);
      setPages(data.seo || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (seoItem) => {
    setEditingSeo(seoItem);
    setFormData({
      metaTitle: seoItem.metaTitle || '',
      metaDescription: seoItem.metaDescription || '',
      urlSlug: seoItem.urlSlug || '',
      canonical: seoItem.canonical || '',
      ogImage: seoItem.ogImage || '',
      robots: seoItem.robots || '',
      llmTxt: seoItem.llmTxt || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await seoApi.update(editingSeo.id, formData);
      await loadSeoData();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSeo(null);
    setFormData({
      metaTitle: '',
      metaDescription: '',
      urlSlug: '',
      canonical: '',
      ogImage: '',
      robots: '',
      llmTxt: '',
    });
  };

  return (
    <div className="seo-page">
      <div className="page-header">
        <h1>SEO Management</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading SEO data...</div>
      ) : pages.length === 0 ? (
        <div className="empty-state">
          <p>No SEO data found. Pages must be created first.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Page Slug</th>
                <th>Meta Title</th>
                <th>Meta Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(seo => (
                <tr key={seo.id}>
                  <td><code>{seo.urlSlug || '-'}</code></td>
                  <td>{seo.metaTitle || '-'}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {seo.metaDescription || '-'}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(seo)} className="btn-sm">Edit SEO</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit SEO</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    value={formData.urlSlug}
                    onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Canonical URL</label>
                  <input
                    type="url"
                    value={formData.canonical}
                    onChange={(e) => setFormData({ ...formData, canonical: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>OG Image URL</label>
                <input
                  type="url"
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Robots (e.g., index, follow)</label>
                  <input
                    type="text"
                    value={formData.robots}
                    onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>LLM.txt context</label>
                  <input
                    type="text"
                    value={formData.llmTxt}
                    onChange={(e) => setFormData({ ...formData, llmTxt: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update SEO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}