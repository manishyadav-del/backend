'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './edit.module.css';

export default function EditPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  // States
  const [activeTab, setActiveTab] = useState('general'); // general, seo, danger
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    template: 'default',
    status: 'DRAFT',
    scheduledAt: '',
    visibility: 'public',
    password: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      canonical: '',
      ogImage: '',
      robots: 'index, follow',
      llmTxt: ''
    }
  });

  // Fetch Page Details
  useEffect(() => {
    fetch(`/api/pages/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.page) {
          const p = data.page;
          setPageData(p);
          
          // Format date for date-time input
          let formattedDate = '';
          if (p.scheduledAt) {
            formattedDate = new Date(p.scheduledAt).toISOString().slice(0, 16);
          }

          setForm({
            title: p.title || '',
            slug: p.slug || '',
            template: p.template || 'default',
            status: p.status?.toUpperCase() || 'DRAFT',
            scheduledAt: formattedDate,
            visibility: p.visibility || 'public',
            password: p.password || '',
            seo: {
              metaTitle: p.seo?.metaTitle || '',
              metaDescription: p.seo?.metaDescription || '',
              canonical: p.seo?.canonical || '',
              ogImage: p.seo?.ogImage || '',
              robots: p.seo?.robots || 'index, follow',
              llmTxt: p.seo?.llmTxt || ''
            }
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching page details:', err);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug,
      template: form.template,
      status: form.status,
      visibility: form.visibility,
      password: form.visibility === 'password' ? form.password : null,
      scheduledAt: form.status === 'SCHEDULED' && form.scheduledAt ? new Date(form.scheduledAt) : null,
      seo: {
        metaTitle: form.seo.metaTitle,
        metaDescription: form.seo.metaDescription,
        canonical: form.seo.canonical,
        ogImage: form.seo.ogImage,
        robots: form.seo.robots,
        llmTxt: form.seo.llmTxt
      }
    };

    try {
      const response = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        router.push('/admin/pages');
      } else {
        alert(data.error || 'Failed to update page settings.');
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving page settings.');
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this page?')) return;
    try {
      const response = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' })
      });
      if (response.ok) {
        router.push('/admin/pages');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to archive page');
      }
    } catch (err) {
      console.error(err);
      alert('Error archiving page');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading page configuration details...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/pages" className={styles.backLink}>
          &larr; Back to Page Registry
        </Link>
        <h1 className={styles.title}>Edit Page Settings</h1>
        <p className={styles.subtitle}>
          Manage configuration parameters, routing rules, publishing status, and SEO metadata for <strong>{pageData?.title}</strong>.
        </p>
      </div>

      {/* Main Settings Card */}
      <form onSubmit={handleSave} className={styles.card}>
        {/* Navigation Tabs */}
        <div className={styles.tabsHeader}>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`${styles.tabButton} ${activeTab === 'general' ? styles.tabActive : ''}`}
          >
            General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`${styles.tabButton} ${activeTab === 'seo' ? styles.tabActive : ''}`}
          >
            SEO & Social
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`${styles.tabButton} ${activeTab === 'danger' ? styles.tabActive : ''}`}
          >
            Danger Zone
          </button>
        </div>

        {/* Tab Contents */}
        <div className={styles.tabContent}>
          {activeTab === 'general' && (
            <div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Connected Application</label>
                  <input
                    type="text"
                    value={pageData?.project?.name || 'Unknown Project'}
                    disabled
                    className={styles.input}
                  />
                  <span className={styles.helpText}>Application domain: {pageData?.project?.domain || 'Not configured'}</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="template">Layout Template</label>
                  <select
                    id="template"
                    value={form.template}
                    onChange={(e) => setForm(prev => ({ ...prev, template: e.target.value }))}
                    className={styles.select}
                  >
                    <option value="default">Default Page Layout</option>
                    <option value="full-width">Full Width Layout</option>
                    <option value="sidebar">Layout with Sidebar</option>
                    <option value="landing">Landing Promo Page</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Page Title *</label>
                  <input
                    type="text"
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="slug">Route Slug *</label>
                  <input
                    type="text"
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              {/* Status & Scheduling */}
              <div className={styles.formRow} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="status">Publish Status</label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value.toUpperCase() }))}
                    className={styles.select}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                {form.status === 'SCHEDULED' && (
                  <div className={styles.formGroup}>
                    <label htmlFor="scheduledAt">Publish Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="scheduledAt"
                      value={form.scheduledAt}
                      onChange={(e) => setForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      className={styles.input}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Visibility & Security */}
              <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <label>Page Visibility & Access</label>
                <div className={styles.visibilitySelector}>
                  <div
                    onClick={() => setForm(prev => ({ ...prev, visibility: 'public' }))}
                    className={`${styles.visOption} ${form.visibility === 'public' ? styles.visOptionActive : ''}`}
                  >
                    <span className={styles.visIcon}>🌐</span>
                    <span className={styles.visTitle}>Public</span>
                    <span className={styles.visDesc}>Everyone can access this page</span>
                  </div>

                  <div
                    onClick={() => setForm(prev => ({ ...prev, visibility: 'private' }))}
                    className={`${styles.visOption} ${form.visibility === 'private' ? styles.visOptionActive : ''}`}
                  >
                    <span className={styles.visIcon}>🔒</span>
                    <span className={styles.visTitle}>Private</span>
                    <span className={styles.visDesc}>Only admin users can view</span>
                  </div>

                  <div
                    onClick={() => setForm(prev => ({ ...prev, visibility: 'password' }))}
                    className={`${styles.visOption} ${form.visibility === 'password' ? styles.visOptionActive : ''}`}
                  >
                    <span className={styles.visIcon}>🔑</span>
                    <span className={styles.visTitle}>Password</span>
                    <span className={styles.visDesc}>Require access code to view</span>
                  </div>
                </div>

                {form.visibility === 'password' && (
                  <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                    <label htmlFor="password">Access Password *</label>
                    <input
                      type="text"
                      id="password"
                      placeholder="Enter access code..."
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className={styles.input}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div>
              <div className={styles.formGroup}>
                <label htmlFor="metaTitle">Meta Title</label>
                <input
                  type="text"
                  id="metaTitle"
                  placeholder="Leave empty to use page title"
                  value={form.seo.metaTitle}
                  onChange={(e) => setForm(prev => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value } }))}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="metaDesc">Meta Description</label>
                <textarea
                  id="metaDesc"
                  rows="3"
                  placeholder="Enter search description snippets..."
                  value={form.seo.metaDescription}
                  onChange={(e) => setForm(prev => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="canonical">Canonical URL</label>
                  <input
                    type="url"
                    id="canonical"
                    placeholder="https://example.com/canonical-path"
                    value={form.seo.canonical}
                    onChange={(e) => setForm(prev => ({ ...prev, seo: { ...prev.seo, canonical: e.target.value } }))}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="robots">Robots Meta tag</label>
                  <select
                    id="robots"
                    value={form.seo.robots}
                    onChange={(e) => setForm(prev => ({ ...prev, seo: { ...prev.seo, robots: e.target.value } }))}
                    className={styles.select}
                  >
                    <option value="index, follow">Index, Follow (Default)</option>
                    <option value="noindex, follow">No-Index, Follow</option>
                    <option value="index, nofollow">Index, No-Follow</option>
                    <option value="noindex, nofollow">No-Index, No-Follow (Private)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ogImage">Open Graph Image (Social Preview) URL</label>
                <input
                  type="text"
                  id="ogImage"
                  placeholder="https://example.com/social-preview.png"
                  value={form.seo.ogImage}
                  onChange={(e) => setForm(prev => ({ ...prev, seo: { ...prev.seo, ogImage: e.target.value } }))}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="llmTxt">Custom LLM Instructions (`llm.txt` content)</label>
                <textarea
                  id="llmTxt"
                  rows="4"
                  placeholder="Context instructions or summaries to display in llm.txt formats for LLM crawlers..."
                  value={form.seo.llmTxt}
                  onChange={(e) => setForm(prev => ({ ...prev, seo: { ...prev.seo, llmTxt: e.target.value } }))}
                  className={styles.textarea}
                />
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div>
              <div className={styles.dangerCard}>
                <div className={styles.dangerHeader}>
                  <span>⚠️</span>
                  <h3 className={styles.dangerTitle}>Archive Page Layout</h3>
                </div>
                <p className={styles.dangerDesc}>
                  Archiving this page hides it from listing panels and disables client route checks. All existing page sections and configuration snapshots are retained in archive format.
                </p>
                <button
                  type="button"
                  onClick={handleArchive}
                  className={styles.btnDanger}
                >
                  Archive Page
                </button>
              </div>

              <div className={styles.dangerCard} style={{ marginTop: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                <div className={styles.dangerHeader}>
                  <span>🚨</span>
                  <h3 className={styles.dangerTitle}>Versions & History Review</h3>
                </div>
                <p className={styles.dangerDesc}>
                  You can view and restore from historic page version snapshots, backups, or draft revisions directly inside the versions management dashboard.
                </p>
                <Link
                  href={`/admin/pages/${id}/versions`}
                  className={styles.btnCancel}
                  style={{ display: 'inline-flex', textDecoration: 'none', fontWeight: 600 }}
                >
                  View Versions History &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <Link href="/admin/pages" className={styles.btnCancel} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
