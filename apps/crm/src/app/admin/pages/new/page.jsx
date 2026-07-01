'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../pages.module.css';

export default function NewPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDesc: '',
    layout: 'default',
    status: 'DRAFT',
    projectId: ''
  });

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projList = data.projects || [];
        setProjects(projList);
        if (projList.length > 0) {
          setForm(prev => ({ ...prev, projectId: projList[0].id }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setLoading(false);
      });
  }, []);

  const handleTitleChange = (val) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setForm(prev => ({
      ...prev,
      title: val,
      slug: slug.startsWith('/') ? slug : '/' + slug,
      metaTitle: val
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) {
      alert('Please select a project/application.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          title: form.title,
          slug: form.slug,
          template: form.layout,
          status: form.status,
          seo: {
            metaTitle: form.metaTitle || form.title,
            metaDescription: form.metaDesc || ''
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        router.push('/admin/pages');
      } else {
        alert(data.error || 'Failed to create page');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating page');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading project configurations...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/pages" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          &larr; Back to Page Registry
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: '0.5rem 0 0 0', letterSpacing: '-0.02em' }}>
          Create Page
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Configure a new custom web page layout and associate it with a client application.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.75rem' }}>
        <div className={styles.formGroup}>
          <label htmlFor="projectId">Target Application / Project *</label>
          <select
            id="projectId"
            value={form.projectId}
            onChange={(e) => setForm(prev => ({ ...prev, projectId: e.target.value }))}
            className={styles.formSelect}
            required
          >
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">Page Title *</label>
          <input
            type="text"
            id="title"
            placeholder="e.g. Services, About Us"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={styles.formInput}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="slug">Route Slug *</label>
          <input
            type="text"
            id="slug"
            placeholder="e.g. /services"
            value={form.slug}
            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
            className={styles.formInput}
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="layout">Layout Template</label>
            <select
              id="layout"
              value={form.layout}
              onChange={(e) => setForm(prev => ({ ...prev, layout: e.target.value }))}
              className={styles.formSelect}
            >
              <option value="default">Default</option>
              <option value="full-width">Full Width</option>
              <option value="sidebar">With Sidebar</option>
              <option value="landing">Landing Page</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Initial Status</label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
              className={styles.formSelect}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>SEO Information (Optional)</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="metaTitle">SEO Meta Title</label>
            <input
              type="text"
              id="metaTitle"
              placeholder="Leave empty to use title"
              value={form.metaTitle}
              onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="metaDesc">SEO Meta Description</label>
            <textarea
              id="metaDesc"
              rows="3"
              placeholder="Search engine description preview..."
              value={form.metaDesc}
              onChange={(e) => setForm(prev => ({ ...prev, metaDesc: e.target.value }))}
              className={styles.formTextarea}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <Link href="/admin/pages" className={styles.btnCancel} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating Page...' : 'Create Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
