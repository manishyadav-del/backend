'use client';

import { useEffect, useState } from 'react';
import { seoApi } from '@/lib/api.js';
import WebsiteAssignmentTab from '@/components/WebsiteAssignmentTab.jsx';

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState('profiles'); // profiles, assignments
  const [pages, setPages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');
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
    schemaMarkup: '',
    redirectPath: '',
  });

  // Fetch Projects / Applications first
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projList = data.projects || [];
        setProjects(projList);
        if (projList.length > 0) {
          // Set to first project by default
          setProjectFilter(projList[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setLoading(false);
      });
  }, []);

  // Reload SEO data when the selected project changes
  useEffect(() => {
    if (projectFilter) {
      loadSeoData();
    }
  }, [projectFilter]);

  async function loadSeoData() {
    try {
      setLoading(true);
      // Query utilizing the selected project filter
      const res = await fetch(`/api/seo?projectId=${projectFilter}`);
      const data = await res.json();
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
      schemaMarkup: seoItem.schemaMarkup || '',
      redirectPath: seoItem.redirectPath || '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.schemaMarkup.trim()) {
        try {
          JSON.parse(formData.schemaMarkup);
        } catch {
          setError('Invalid JSON format in Schema Markup field');
          return;
        }
      }
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
      schemaMarkup: '',
      redirectPath: '',
    });
  };

  const inp = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
  };

  const selectStyle = {
    padding: '0.5rem 2rem 0.5rem 1rem',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1rem',
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '85vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, letterSpacing: '-0.02em' }}>SEO Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Configure metadata, canonicals, robots rules, Schema JSON-LD, sitemap parameters, and redirects.
          </p>
        </div>

        {/* Project Selector Filter */}
        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={selectStyle}
            >
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  📁 {proj.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('profiles')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'profiles' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'profiles' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'profiles' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          SEO Profiles
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'assignments' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Website Assignment
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'profiles' && (
        <>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="loading">Loading SEO configs...</div>
            </div>
          ) : pages.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No pages found in this project</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Create pages under the Pages section to manage their SEO profiles.</p>
            </div>
          ) : (
            <div className="data-table-container" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Page Info</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SEO Title</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Meta Description</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Slug</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Canonical</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OG Image</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Robots.txt</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sitemap</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Schema</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Redirects</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LLM.txt</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(seo => {
                    const hasSeo = seo.metaTitle || seo.metaDescription;
                    return (
                      <tr key={seo.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{seo.pageTitle}</div>
                          <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            /{seo.pageSlug}
                          </code>
                        </td>
                        
                        {/* SEO Title */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          {seo.metaTitle ? (
                            <span style={{ color: 'var(--text-primary)' }}>{seo.metaTitle}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        {/* Meta Description */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {seo.metaDescription || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                        </td>

                        {/* Slug */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          <code style={{ color: 'var(--primary)' }}>{seo.urlSlug}</code>
                        </td>

                        {/* Canonical */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {seo.canonical ? (
                            <a href={seo.canonical} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Link</a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Auto</span>
                          )}
                        </td>

                        {/* OG Image */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          {seo.ogImage ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>🖼️ Set</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Robots.txt */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          <code style={{ fontSize: '0.72rem' }}>{seo.robots}</code>
                        </td>

                        {/* Sitemap */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          {seo.inSitemap ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>🟢 Include</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>⚪ Exclude</span>
                          )}
                        </td>

                        {/* Schema */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          {seo.schemaMarkup ? (
                            <span style={{ color: '#8b5cf6', fontWeight: 600 }}>📁 JSON-LD</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Redirects */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {seo.redirectPath ? (
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>➡️ {seo.redirectPath}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* LLM.txt */}
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                          {seo.llmTxt ? (
                            <span style={{ color: '#0ea5e9', fontWeight: 600 }}>🤖 Active</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button onClick={() => handleEdit(seo)} className="btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                            ⚙️ Configure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <WebsiteAssignmentTab moduleKey="seo" />
      )}

      {/* Edit SEO Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999 }}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '90%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-h1)' }}>
                ⚙️ Configure Page SEO: {editingSeo?.pageTitle}
              </h2>
              <button onClick={closeModal} className="modal-close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Meta SEO Title</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="Page SEO Meta Title Tag"
                    style={inp}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>URL Slug Override</label>
                  <input
                    type="text"
                    value={formData.urlSlug}
                    onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value })}
                    placeholder="slug-override-path"
                    style={inp}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows="2"
                  placeholder="Provide page summary meta description (keep it between 120-160 characters)"
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Canonical URL</label>
                  <input
                    type="url"
                    value={formData.canonical}
                    onChange={(e) => setFormData({ ...formData, canonical: e.target.value })}
                    placeholder="https://example.com/canonical-url"
                    style={inp}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>OG Image URL</label>
                  <input
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    placeholder="https://example.com/social-share.jpg"
                    style={inp}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Robots Instruction Tag</label>
                  <input
                    type="text"
                    value={formData.robots}
                    onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
                    placeholder="e.g. index, follow"
                    style={inp}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>301 Redirect Target Path</label>
                  <input
                    type="text"
                    value={formData.redirectPath}
                    onChange={(e) => setFormData({ ...formData, redirectPath: e.target.value })}
                    placeholder="e.g. /new-target-page (leave blank to disable)"
                    style={inp}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>JSON-LD Schema Markup (Structured Data)</label>
                <textarea
                  value={formData.schemaMarkup}
                  onChange={(e) => setFormData({ ...formData, schemaMarkup: e.target.value })}
                  rows="3"
                  placeholder='e.g. { "@context": "https://schema.org", "@type": "MedicalBusiness", "name": "AHealthPlace" }'
                  style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>LLM.txt Context (Information for AI Crawlers)</label>
                <textarea
                  value={formData.llmTxt}
                  onChange={(e) => setFormData({ ...formData, llmTxt: e.target.value })}
                  rows="2"
                  placeholder="AI Crawlers guidelines, documentation summaries, or tags..."
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}